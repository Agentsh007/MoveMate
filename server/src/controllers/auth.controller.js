// =============================================
// Auth Controller — Registration, Login, JWT
// =============================================
// HOW JWT AUTH FLOW WORKS:
// 1. User registers → password is hashed with bcrypt → saved to DB
// 2. User logs in → password compared with hash → JWT tokens generated
// 3. Access token (15 min) → sent to client, used for API calls
// 4. Refresh token (7 days) → sent to client, used to get new access token
// 5. When access token expires, client sends refresh token to /refresh
// 6. Server verifies refresh token → issues new access token
//
// WHY two tokens?
// - Access token is short-lived → limits damage if stolen
// - Refresh token is long-lived → user doesn't re-login every 15 min
// =============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { userQueries } from '../queries/user.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

// Generate JWT access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

// Generate JWT refresh token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/register
 * Create a new user account
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  // Check if user already exists
  const existing = await query(userQueries.findByEmail, [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  // Hash password — bcrypt automatically generates a salt
  // The "12" is the salt rounds (higher = slower but more secure)
  const passwordHash = await bcrypt.hash(password, 12);

  // Insert user (role defaults to 'user' if not specified)
  const validRole = role === 'owner' ? 'owner' : 'user';
  const { rows } = await query(userQueries.create, [
    name, email, phone || null, passwordHash, validRole
  ]);

  const user = rows[0];

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Create empty profile
  await query(userQueries.upsertProfile, [user.id, null, null, null, null]);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user by email
  const { rows } = await query(userQueries.findByEmail, [email]);
  if (rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = rows[0];

  // Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

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
    accessToken,
    refreshToken,
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
 * Get a new access token using a refresh token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token required', 400);
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Get the user
    const { rows } = await query(userQueries.findById, [decoded.id]);
    if (!rows[0]) {
      throw new AppError('User not found', 404);
    }

    // Generate new access token
    const accessToken = generateAccessToken(rows[0]);

    res.json({ success: true, accessToken });
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side — just acknowledges)
 * In a production app, you'd blacklist the refresh token
 */
export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar_url, latitude, longitude, current_city } = req.body;

  // Update user basic info
  if (name || phone) {
    await query(userQueries.update, [req.user.id, name, phone]);
  }

  // Update profile
  const { rows } = await query(userQueries.upsertProfile, [
    req.user.id, avatar_url || null, latitude || null, longitude || null, current_city || null
  ]);

  // Get updated user with profile
  const result = await query(userQueries.findWithProfile, [req.user.id]);

  res.json({ success: true, user: result.rows[0] });
});
