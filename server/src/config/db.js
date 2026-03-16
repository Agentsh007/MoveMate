// =============================================
// Database Configuration — PostgreSQL Connection Pool
// =============================================
// WHY a pool instead of single connection?
// A pool maintains multiple database connections ready to use.
// When your API gets 50 concurrent requests, each needs its own
// DB connection. A pool manages this efficiently:
// - max: 20 = up to 20 simultaneous connections
// - idleTimeoutMillis: close unused connections after 30s
// - connectionTimeoutMillis: fail fast if DB is unreachable
//
// USAGE:
//   import { query } from './db.js';
//   const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
//
// The $1 syntax is PARAMETERIZED QUERY — it prevents SQL injection.
// NEVER do: `SELECT * FROM users WHERE id = '${userId}'` ← THIS IS DANGEROUS
// =============================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                        // Maximum connections in pool
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 2000,  // Timeout if can't connect in 2s
});

// Log when pool connects (helpful for debugging)
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

/**
 * Execute a SQL query with parameterized values
 * @param {string} text - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Values to substitute into placeholders
 * @returns {Promise<pg.QueryResult>} Query result with rows array
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Get a dedicated client from the pool (for transactions)
 * IMPORTANT: Always release the client when done!
 * 
 * Usage:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     await client.query('INSERT INTO ...', [...]);
 *     await client.query('COMMIT');
 *   } catch (err) {
 *     await client.query('ROLLBACK');
 *     throw err;
 *   } finally {
 *     client.release(); // ← Always release!
 *   }
 */
export const getClient = () => pool.connect();

export default pool;
