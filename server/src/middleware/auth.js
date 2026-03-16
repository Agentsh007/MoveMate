// =============================================
// Auth Middleware — JWT Token Verification
// =============================================
// HOW JWT AUTH WORKS:
// 1. User logs in → server creates a JWT token containing { id, role }
// 2. Client stores the token and sends it with every request as:
//    Authorization: Bearer <token>
// 3. This middleware extracts the token, verifies it with the secret,
//    and looks up the user in the database
// 4. If valid, req.user is populated and the request continues
// 5. If invalid/expired, return 401 Unauthorized
//
// Two levels of protection:
// - protect: any authenticated user
// - ownerOnly: only users with role 'owner' or 'admin'
// =============================================

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

/**
 * Verify JWT token and attach user to request
 * Use this on any route that requires login
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token from "Bearer <token>" header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated — no token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up user in DB (ensures user still exists and gets latest role)
    const { rows } = await query(
      'SELECT id, name, email, role, is_verified FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Attach user object to request — accessible in controllers
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired — please refresh' });
    }
    return res.status(401).json({ message: 'Invalid token' });
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
 * Useful for routes that show different data to logged-in vs guest users
 * (e.g., property detail shows owner contact only to logged-in users)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, name, email, role, is_verified FROM users WHERE id = $1',
      [decoded.id]
    );

    req.user = rows[0] || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};
