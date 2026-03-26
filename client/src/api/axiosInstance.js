// =============================================
// Axios Instance — Supabase Token Integration
// =============================================
// Gets the access token from Supabase Auth session instead of localStorage.
// Supabase SDK handles token refresh automatically.
// =============================================

import axios from 'axios';
import supabase from '../lib/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Supabase auth token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('Failed to get session:', err);
  }
  return config;
});

// Response interceptor — handle 401 by refreshing session
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Supabase auto-refreshes the token
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Session expired completely — sign out
        await supabase.auth.signOut();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
