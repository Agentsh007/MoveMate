// =============================================
// Migration Runner — Execute SQL Migration Files
// =============================================
// HOW MIGRATIONS WORK:
// Instead of manually creating tables via pgAdmin, we write SQL files
// and run them in order. This ensures:
// - Every developer gets the same database schema
// - Changes are version-controlled in git
// - You can recreate the entire DB from scratch
//
// Run: node migrate.js
// =============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Read all .sql files and sort them by number prefix
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n🗄️  Running ${files.length} migrations...\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`  ▶ ${file}...`);
      await client.query(sql);
      console.log(`  ✅ ${file} — done`);
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Fix the issue and run again.\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
