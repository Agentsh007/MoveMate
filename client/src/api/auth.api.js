// =============================================
// Auth API — Supabase Auth Integration
// =============================================
// Login/register go through Supabase Auth SDK directly,
// then hit our backend to sync user data.
// =============================================

import api from './axiosInstance';
import supabase from '../lib/supabase';

export const authAPI = {
  // Register: Supabase Auth + backend sync
  register: async (data) => {
    // 1. Create user via our backend (which creates Supabase Auth + DB user)
    const response = await api.post('/auth/register', data);

    // 2. Sign in with Supabase to get session
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('Auto-login after register failed:', error);
    }

    return response;
  },

  // Login: Supabase Auth + backend user data
  login: async ({ email, password }) => {
    // 1. Sign in with Supabase Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw { response: { data: { message: error.message || 'Invalid email or password' } } };
    }

    // 2. Get our app user data from backend
    const response = await api.get('/auth/me');

    return {
      data: {
        success: true,
        user: response.data.user,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      },
    };
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    return { data: { success: true } };
  },

  // Get current user
  getMe: () => api.get('/auth/me'),

  // Refresh token (handled by Supabase SDK, but exposed for compatibility)
  refreshToken: async (token) => {
    const { data } = await supabase.auth.refreshSession({ refresh_token: token });
    return {
      data: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      },
    };
  },

  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
};
