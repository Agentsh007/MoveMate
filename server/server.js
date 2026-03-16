// =============================================
// Server Entry Point — server.js
// =============================================
// This file starts the Express server and verifies
// the database and email connections are working.
// =============================================

import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import pool from './src/config/db.js';
import { verifyEmailTransport } from './src/config/email.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ Database connected: ${result.rows[0].now}`);

    // Verify email transport
    await verifyEmailTransport();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 MoveMate API running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Frontend URL: ${process.env.CLIENT_URL}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
