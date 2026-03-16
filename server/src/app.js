// =============================================
// Express App Setup — app.js
// =============================================
// This file configures the Express application with:
// 1. Security middleware (helmet, cors, rate limiting)
// 2. Request parsing (JSON, URL-encoded)
// 3. Logging (morgan)
// 4. Compression (gzip responses)
// 5. API routes
// 6. Global error handler
//
// WHY separate app.js and server.js?
// - app.js = Express configuration (testable without starting server)
// - server.js = Starting the server (binding to port)
// This separation makes the app testable with supertest.
// =============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/property.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reviewRoutes from './routes/review.routes.js';
import essentialsRoutes from './routes/essentials.routes.js';
import emergencyRoutes from './routes/emergency.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { protect } from './middleware/auth.js';
import { query } from './config/db.js';
import { locationQueries } from './queries/location.queries.js';

const app = express();

// ---- Security Middleware ----
// helmet: Sets various HTTP headers to prevent common attacks
// (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS: Allow requests from our React frontend
// credentials: true = allow cookies/auth headers from frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ---- Request Processing ----
// compression: gzip responses to reduce bandwidth
app.use(compression());

// morgan: HTTP request logger (shows method, URL, status, response time)
app.use(morgan('dev'));

// Parse JSON bodies (from POST/PUT requests)
app.use(express.json());

// Parse URL-encoded bodies (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// ---- Rate Limiting ----
// Prevent abuse: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/essentials', essentialsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);

// ---- Saved Listings Routes (inline, simple) ----
app.post('/api/saved-listings', protect, async (req, res) => {
  const { property_id } = req.body;
  const { rows } = await query(locationQueries.saveListing, [req.user.id, property_id]);
  res.json({ success: true, saved: rows[0] });
});

app.delete('/api/saved-listings/:propertyId', protect, async (req, res) => {
  await query(locationQueries.unsaveListing, [req.user.id, req.params.propertyId]);
  res.json({ success: true, message: 'Removed from saved' });
});

app.get('/api/saved-listings', protect, async (req, res) => {
  const { rows } = await query(locationQueries.getSavedListings, [req.user.id]);
  res.json({ success: true, listings: rows });
});

app.get('/api/saved-listings/check/:propertyId', protect, async (req, res) => {
  const { rows } = await query(locationQueries.isSaved, [req.user.id, req.params.propertyId]);
  res.json({ success: true, isSaved: rows.length > 0 });
});

// ---- Moving Waitlist (passive email collection) ----
app.post('/api/moving-waitlist', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  await query('INSERT INTO moving_waitlist (email) VALUES ($1) ON CONFLICT DO NOTHING', [email]);
  res.json({ success: true, message: 'Added to waitlist!' });
});

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Global Error Handler (MUST be last) ----
app.use(errorHandler);

export default app;
