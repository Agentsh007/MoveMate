// =============================================
// Auth Middleware — Supabase Token Verification
// =============================================
// HOW SUPABASE AUTH WORKS:
// 1. User logs in via Supabase Auth → receives a JWT access token
// 2. Client sends token with every request as:
//    Authorization: Bearer <token>
// 3. This middleware sends token to Supabase to verify it
// 4. Supabase returns the auth user → we look up our local user
// 5. req.user is populated with our DB user data
//
// Two levels of protection:
// - protect: any authenticated user
// - ownerOnly: only users with role 'owner' or 'admin'
// - optionalAuth: populates req.user if token present, null otherwise
// =============================================

import { supabaseAdmin } from '../config/supabase.js';
import { query } from '../config/db.js';

/**
 * Verify Supabase auth token and attach user to request
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated — no token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !authUser) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Look up our local user by Supabase auth_id
    const { rows } = await query(
      'SELECT id, name, email, role, is_verified FROM users WHERE auth_id = $1',
      [authUser.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ message: 'User not found in database' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Restrict access to property owners and admins only
 * Must be used AFTER protect middleware
 */
export const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Owner access required' });
  }
  next();
};

/**
 * Optional auth — doesn't fail if no token, but populates req.user if present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !authUser) {
      req.user = null;
      return next();
    }

    const { rows } = await query(
      'SELECT id, name, email, role, is_verified FROM users WHERE auth_id = $1',
      [authUser.id]
    );

    req.user = rows[0] || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};
