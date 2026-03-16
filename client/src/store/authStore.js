// =============================================
// Auth Store — Zustand with Persist
// =============================================
// WHY Zustand over Redux?
// - Zero boilerplate — no actions, reducers, providers
// - Built-in persist middleware (saves to localStorage)
// - Can be used OUTSIDE React components (e.g., in Axios interceptors)
// - Access state with: useAuthStore.getState().token
//
// The persist middleware automatically saves state to localStorage
// under the key 'auth-storage'. When the app refreshes, state is
// restored from localStorage, so the user stays logged in.
// =============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,

      // Actions
      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken }),

      setToken: (token) =>
        set({ token }),

      setUser: (user) =>
        set({ user }),

      logout: () =>
        set({ user: null, token: null, refreshToken: null }),

      // Computed (getters)
      isLoggedIn: () => !!get().token,
      isOwner: () => get().user?.role === 'owner' || get().user?.role === 'admin',
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);

export default useAuthStore;
