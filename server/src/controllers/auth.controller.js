// =============================================
// Auth Controller — Supabase Auth Integration
// =============================================
// HOW IT WORKS:
// 1. Register: Create user in Supabase Auth → save to our users table
// 2. Login: Supabase Auth verifies credentials → returns session tokens
// 3. Refresh: Supabase handles token refresh via its SDK
// 4. Logout: Revoke session via Supabase Auth
//
// Our users table stores app-specific data (role, phone, name)
// Supabase auth.users stores credentials (email, password hash)
// They're linked by the auth_id column
// =============================================

import { supabaseAdmin } from '../config/supabase.js';
import { query } from '../config/db.js';
import { userQueries } from '../queries/user.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/auth/register
 * Create a new user account via Supabase Auth + our DB
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-verify for dev
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      throw new AppError('Email already registered', 409);
    }
    throw new AppError(authError.message || 'Failed to create auth user', 400);
  }

  const authId = authData.user.id;

  // 2. Save user in our users table with the auth_id link
  const validRole = role === 'owner' ? 'owner' : 'user';
  const { rows } = await query(userQueries.create, [
    name, email, phone || null, validRole, authId
  ]);

  const user = rows[0];

  // 3. Create empty profile
  await query(userQueries.upsertProfile, [user.id, null, null, null, null]);

  // 4. Sign in to get session tokens
  const { data: session, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  // Return session — client will use Supabase SDK for login
  res.status(201).json({
    success: true,
    message: 'Registration successful — please login',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticate via Supabase Auth — returns session tokens
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Supabase Auth handles password verification
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AppError('Invalid email or password', 401);
  }

  // Get our local user data
  const { rows } = await query(userQueries.findByAuthId, [data.user.id]);
  if (!rows[0]) {
    throw new AppError('User not found in database', 404);
  }

  const user = rows[0];

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
export const getMe = asyncHandler(async (req, res) => {
  const { rows } = await query(userQueries.findWithProfile, [req.user.id]);

  if (!rows[0]) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, user: rows[0] });
});

/**
 * POST /api/auth/refresh
 * Refresh access token via Supabase Auth
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token required', 400);
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: token,
  });

  if (error || !data.session) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  res.json({
    success: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

/**
 * POST /api/auth/logout
 * Sign out from Supabase Auth
 */
export const logout = asyncHandler(async (req, res) => {
  // Extract token to sign out the specific session
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar_url, latitude, longitude, current_city } = req.body;

  if (name || phone) {
    await query(userQueries.update, [req.user.id, name, phone]);
  }

  await query(userQueries.upsertProfile, [
    req.user.id, avatar_url || null, latitude || null, longitude || null, current_city || null
  ]);

  const result = await query(userQueries.findWithProfile, [req.user.id]);
  res.json({ success: true, user: result.rows[0] });
});
