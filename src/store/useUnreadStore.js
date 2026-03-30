import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

// localStorage key for tracking when the user last opened messages
const LAST_SEEN_MESSAGES_KEY = 'lekho_last_seen_messages';

export const getLastSeenMessages = () => {
  return localStorage.getItem(LAST_SEEN_MESSAGES_KEY) || new Date(0).toISOString();
};

export const setLastSeenMessages = () => {
  localStorage.setItem(LAST_SEEN_MESSAGES_KEY, new Date().toISOString());
};

export const useUnreadStore = create((set, get) => ({
  unreadMessages: 0,
  unreadNotifications: 0,
  intervalId: null,
  realtimeChannel: null,

  fetchCounts: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      // 1. Unread Notifications
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // 2. Unread Messages (timestamp-based — no is_read column needed)
      const lastSeen = getLastSeenMessages();
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .gt('created_at', lastSeen);

      set({
        unreadNotifications: notifCount || 0,
        unreadMessages: msgCount || 0,
      });
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  },

  // 🔥 Start Supabase Realtime subscriptions for instant badge updates
  startRealtime: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Cleanup existing channel first
    const existing = get().realtimeChannel;
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(`unread-badges-${user.id}`)
      // Listen for NEW messages sent TO ME
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const lastSeen = getLastSeenMessages();
          // Only badge if the message arrived after the user last saw messages
          if (new Date(payload.new.created_at) > new Date(lastSeen)) {
            set((state) => ({ unreadMessages: state.unreadMessages + 1 }));
          }
        }
      )
      // Listen for NEW notifications sent TO ME
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          set((state) => ({ unreadNotifications: state.unreadNotifications + 1 }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime badge channel connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime not enabled — falling back to polling only');
        }
      });

    set({ realtimeChannel: channel });
  },

  startPolling: (intervalMs = 30000) => {
    if (get().intervalId) return;

    // Do an immediate fetch + start realtime
    get().fetchCounts();
    get().startRealtime();

    // Periodic fallback sync (every 30s) in case realtime misses something
    const id = setInterval(() => {
      get().fetchCounts();
    }, intervalMs);

    set({ intervalId: id });
  },

  stopPolling: () => {
    if (get().intervalId) {
      clearInterval(get().intervalId);
      set({ intervalId: null });
    }
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },

  clearNotifications: () => set({ unreadNotifications: 0 }),
  clearMessages: () => {
    setLastSeenMessages(); // Save current time → future messages count as "new"
    set({ unreadMessages: 0 });
  },
}));
