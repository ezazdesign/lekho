import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        await useAuthStore.getState().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null, loading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          set({ user: session.user });
          await useAuthStore.getState().fetchProfile(session.user.id);
        } else {
          set({ user: null, profile: null, loading: false });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
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
