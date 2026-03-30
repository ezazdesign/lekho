import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    set({ loading: true });
    try {
      // Race getSession against a 10s timeout to prevent hanging on wake-up
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timed out')), 10000)
      );

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (session?.user) {
        set({ user: session.user });
        await useAuthStore.getState().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null, loading: false });
      }

      // Listen for auth changes (login/logout/token refresh)
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            set({ user: session.user });
            await useAuthStore.getState().fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, loading: false });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  },

  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ user: null, profile: null, loading: false });
    } else if (!useAuthStore.getState().user) {
      set({ user: session.user });
      await useAuthStore.getState().fetchProfile(session.user.id);
    }
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
      
      set({ profile: data || null, loading: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  }
}));
