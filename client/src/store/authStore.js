// =============================================
// Auth Store — Supabase Session Management
// =============================================
// Uses Supabase Auth for session management instead of manual JWT handling.
// onAuthStateChange listener auto-syncs auth state.
// =============================================

import { create } from 'zustand';
import supabase from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,

  // Initialize — called once on app load
  initialize: async () => {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      set({ session, loading: false });
      // Fetch our app user data from backend
      get().fetchUser(session.access_token);
    } else {
      set({ loading: false });
    }

    // Listen for auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session });

      if (event === 'SIGNED_IN' && session) {
        get().fetchUser(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, session: null });
      }
    });
  },

  // Fetch our app user from the backend
  fetchUser: async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { user } = await res.json();
        set({ user });
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  // Getters
  get isLoggedIn() { return !!get().session; },
  get isOwner() { return get().user?.role === 'owner' || get().user?.role === 'admin'; },
  get isAdmin() { return get().user?.role === 'admin'; },
}));

export default useAuthStore;
