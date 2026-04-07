// Start of: ./server\migrate.js
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
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
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

// End of file

// Start of: ./server\server.js
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

// End of file

// Start of: ./server\seeds\seed.js
// =============================================
// Seed Data — Supabase Auth Compatible
// =============================================
// Creates test data for Dhaka, Bangladesh:
// - Creates users via Supabase Auth API (not direct DB insert)
// - 5 owner accounts, 2 user accounts
// - 15 properties, reviews, essentials, emergency contacts
//
// Run: cd server && node seeds/seed.js
// =============================================

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Supabase admin client for creating auth users
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };
const vary = (center, range = 0.03) => center + (Math.random() - 0.5) * range * 2;

async function seed() {
  const client = await pool.connect();

  try {
    console.log('\n🌱 Starting seed (Supabase Auth mode)...\n');

    // Clean existing data (reverse FK order)
    await client.query(`
      DELETE FROM moving_waitlist;
      DELETE FROM saved_listings;
      DELETE FROM notifications;
      DELETE FROM payments;
      DELETE FROM rental_agreements;
      DELETE FROM rental_visits;
      DELETE FROM booking_requests;
      DELETE FROM reviews;
      DELETE FROM bookings;
      DELETE FROM property_rules;
      DELETE FROM property_amenities;
      DELETE FROM property_images;
      DELETE FROM properties;
      DELETE FROM essential_services;
      DELETE FROM essential_categories;
      DELETE FROM emergency_contacts;
      DELETE FROM emergency_categories;
      DELETE FROM user_profiles;
      DELETE FROM users;
    `);
    console.log('  🗑️  Cleared existing data');

    // Clean Supabase Auth users (delete all existing test users)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    for (const u of (existingUsers?.users || [])) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
    console.log('  🗑️  Cleared Supabase Auth users');

    const TEST_PASSWORD = 'Test@1234';

    // ===================== USERS =====================
    const owners = [];
    for (let i = 1; i <= 5; i++) {
      const email = `owner${i}@dummyinbox.com`;

      // Create in Supabase Auth
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });

      if (authErr) {
        console.error(`  ❌ Failed to create auth user ${email}:`, authErr.message);
        continue;
      }

      // Create in our users table
      const { rows } = await client.query(
        `INSERT INTO users (name, email, phone, role, is_verified, auth_id)
         VALUES ($1, $2, $3, 'owner', true, $4) RETURNING *`,
        [`Owner ${i}`, email, `+8801700000${i}0${i}`, authData.user.id]
      );
      owners.push(rows[0]);

      await client.query(
        `INSERT INTO user_profiles (user_id, avatar_url, current_city, latitude, longitude)
         VALUES ($1, $2, 'Dhaka', $3, $4)`,
        [rows[0].id, `https://i.pravatar.cc/150?img=${i + 10}`, vary(DHAKA_CENTER.lat), vary(DHAKA_CENTER.lng)]
      );
    }
    console.log('  👤 Created 5 owner accounts (Supabase Auth)');

    const users = [];
    for (let i = 1; i <= 2; i++) {
      const email = `user${i}@dummyinbox.com`;

      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });

      if (authErr) {
        console.error(`  ❌ Failed to create auth user ${email}:`, authErr.message);
        continue;
      }

      const { rows } = await client.query(
        `INSERT INTO users (name, email, phone, role, is_verified, auth_id)
         VALUES ($1, $2, $3, 'user', true, $4) RETURNING *`,
        [`User ${i}`, email, `+8801800000${i}0${i}`, authData.user.id]
      );
      users.push(rows[0]);

      await client.query(
        `INSERT INTO user_profiles (user_id, avatar_url, current_city, latitude, longitude)
         VALUES ($1, $2, 'Dhaka', $3, $4)`,
        [rows[0].id, `https://i.pravatar.cc/150?img=${i + 20}`, vary(DHAKA_CENTER.lat), vary(DHAKA_CENTER.lng)]
      );
    }
    console.log('  👤 Created 2 user accounts (Supabase Auth)');

    // ===================== PROPERTIES =====================
    const propertyData = [
      { title: 'Grand Dhaka Hotel & Suites', type: 'hotel', model: 'hotel_style', price: 3500, unit: 'per_night', area: 'Gulshan', beds: 1, baths: 1, guests: 2, sqft: 450 },
      { title: 'Banani Boutique Hotel', type: 'hotel', model: 'hotel_style', price: 5000, unit: 'per_night', area: 'Banani', beds: 2, baths: 1, guests: 4, sqft: 650 },
      { title: 'Dhanmondi Garden Inn', type: 'hotel', model: 'hotel_style', price: 2500, unit: 'per_night', area: 'Dhanmondi', beds: 1, baths: 1, guests: 2, sqft: 350 },
      { title: 'Modern 3-Bed Flat in Uttara', type: 'flat', model: 'long_term', price: 25000, unit: 'per_month', area: 'Uttara', beds: 3, baths: 2, guests: 6, sqft: 1200 },
      { title: 'Cozy 2-Bed Flat, Mirpur', type: 'flat', model: 'long_term', price: 15000, unit: 'per_month', area: 'Mirpur', beds: 2, baths: 1, guests: 4, sqft: 900 },
      { title: 'Luxury Flat with Lake View', type: 'flat', model: 'long_term', price: 40000, unit: 'per_month', area: 'Gulshan', beds: 3, baths: 2, guests: 5, sqft: 1600 },
      { title: 'Affordable Bachelor Flat', type: 'flat', model: 'long_term', price: 8000, unit: 'per_month', area: 'Mohammadpur', beds: 1, baths: 1, guests: 2, sqft: 500 },
      { title: 'Serviced Apartment Banani', type: 'apartment', model: 'short_term', price: 4500, unit: 'per_night', area: 'Banani', beds: 2, baths: 2, guests: 4, sqft: 1000, instant: true },
      { title: 'Executive Apartment Gulshan', type: 'apartment', model: 'short_term', price: 6000, unit: 'per_night', area: 'Gulshan', beds: 3, baths: 2, guests: 6, sqft: 1400, instant: false },
      { title: 'Studio Apartment Dhanmondi', type: 'apartment', model: 'short_term', price: 2000, unit: 'per_night', area: 'Dhanmondi', beds: 1, baths: 1, guests: 2, sqft: 400, instant: true },
      { title: 'Sublet Room near BUET', type: 'sublet', model: 'short_term', price: 1500, unit: 'per_night', area: 'Old Dhaka', beds: 1, baths: 1, guests: 1, sqft: 200, instant: true },
      { title: 'Furnished Sublet in Uttara', type: 'sublet', model: 'short_term', price: 2000, unit: 'per_night', area: 'Uttara', beds: 1, baths: 1, guests: 2, sqft: 300, instant: false },
      { title: 'Shared Sublet for Students', type: 'sublet', model: 'short_term', price: 800, unit: 'per_night', area: 'Nilkhet', beds: 1, baths: 1, guests: 1, sqft: 150, instant: true },
      { title: 'Family House To-Let Mirpur', type: 'tolet', model: 'long_term', price: 20000, unit: 'per_month', area: 'Mirpur', beds: 4, baths: 2, guests: 8, sqft: 1800 },
      { title: 'Commercial Space To-Let Motijheel', type: 'tolet', model: 'long_term', price: 50000, unit: 'per_month', area: 'Motijheel', beds: 0, baths: 1, guests: 10, sqft: 2000 },
    ];

    const imageUrls = [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    ];

    const amenityOptions = ['WiFi', 'AC', 'Parking', 'Kitchen', 'Elevator', 'Generator', 'Security', 'Laundry', 'Rooftop', 'Gym', 'Pool', 'CCTV', 'Balcony', 'Furnished'];
    const ruleOptions = ['No smoking inside', 'No pets allowed', 'Quiet hours after 10 PM', 'No parties or events', 'Shoes off inside', 'Keep common areas clean'];

    const areaCoords = {
      'Gulshan': { lat: 23.7925, lng: 90.4078 }, 'Banani': { lat: 23.7937, lng: 90.4028 },
      'Dhanmondi': { lat: 23.7465, lng: 90.3760 }, 'Uttara': { lat: 23.8759, lng: 90.3795 },
      'Mirpur': { lat: 23.8040, lng: 90.3653 }, 'Mohammadpur': { lat: 23.7662, lng: 90.3586 },
      'Old Dhaka': { lat: 23.7120, lng: 90.4070 }, 'Nilkhet': { lat: 23.7332, lng: 90.3909 },
      'Motijheel': { lat: 23.7333, lng: 90.4185 },
    };

    const properties = [];
    for (let i = 0; i < propertyData.length; i++) {
      const pd = propertyData[i];
      const owner = owners[i % owners.length];
      const coords = areaCoords[pd.area] || DHAKA_CENTER;

      const { rows } = await client.query(
        `INSERT INTO properties (owner_id, title, description, property_type, booking_model,
          address, city, latitude, longitude, bedrooms, bathrooms, area_sqft, max_guests,
          base_price, price_unit, instant_book, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Dhaka', $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active')
         RETURNING *`,
        [
          owner.id, pd.title,
          `Beautiful ${pd.type} located in ${pd.area}, Dhaka. Fully furnished with modern amenities. Perfect for ${pd.model === 'long_term' ? 'families' : 'travelers'}.`,
          pd.type, pd.model,
          `House ${i + 1}, Road ${Math.floor(Math.random() * 20) + 1}, ${pd.area}, Dhaka`,
          vary(coords.lat, 0.01), vary(coords.lng, 0.01),
          pd.beds, pd.baths, pd.sqft, pd.guests, pd.price, pd.unit, pd.instant || false,
        ]
      );

      const property = rows[0];
      properties.push(property);

      for (let j = 0; j < 5; j++) {
        await client.query(
          `INSERT INTO property_images (property_id, url, is_primary, display_order) VALUES ($1, $2, $3, $4)`,
          [property.id, imageUrls[j], j === 0, j]
        );
      }

      const shuffled = [...amenityOptions].sort(() => 0.5 - Math.random());
      for (let j = 0; j < 3; j++) {
        await client.query(`INSERT INTO property_amenities (property_id, name) VALUES ($1, $2)`, [property.id, shuffled[j]]);
      }

      for (let j = 0; j < 2; j++) {
        await client.query(`INSERT INTO property_rules (property_id, rule_text) VALUES ($1, $2)`, [property.id, ruleOptions[j]]);
      }
    }
    console.log(`  🏠 Created ${properties.length} properties with images, amenities, and rules`);

    // ===================== BOOKINGS & REVIEWS =====================
    const comments = [
      'Great place! Very clean and well maintained.',
      'Excellent location, friendly owner. Would stay again!',
      'Very comfortable and spacious. Highly recommended.',
      'Perfect for families. All amenities as described.',
      'Good value for money. Nice neighborhood.',
    ];

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const user = users[i % users.length];

      const { rows: bookingRows } = await client.query(
        `INSERT INTO bookings (property_id, user_id, booking_type, check_in, check_out, guests, total_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed') RETURNING *`,
        [
          property.id, user.id,
          property.booking_model === 'hotel_style' ? 'hotel_pay_now' : property.booking_model === 'short_term' ? 'short_term_instant' : 'long_term_inquiry',
          '2025-12-01', '2025-12-05', 2, property.base_price * 4,
        ]
      );

      const rating = Math.floor(Math.random() * 2) + 4;
      await client.query(
        `INSERT INTO reviews (property_id, reviewer_id, booking_id, rating, comment) VALUES ($1, $2, $3, $4, $5)`,
        [property.id, user.id, bookingRows[0].id, rating, comments[i % comments.length]]
      );
    }
    console.log('  📝 Created bookings and reviews');

    // ===================== ESSENTIALS =====================
    const essentialCategoryData = [
      { name: 'Pharmacy', icon: 'Pill', color: '#10B981', order: 1 },
      { name: 'Grocery', icon: 'ShoppingCart', color: '#F59E0B', order: 2 },
      { name: 'Hospital', icon: 'Hospital', color: '#EF4444', order: 3 },
      { name: 'Bank', icon: 'Landmark', color: '#3B82F6', order: 4 },
      { name: 'Restaurant', icon: 'UtensilsCrossed', color: '#8B5CF6', order: 5 },
      { name: 'Fuel', icon: 'Fuel', color: '#6B7280', order: 6 },
    ];

    const essentialCategories = [];
    for (const cat of essentialCategoryData) {
      const { rows } = await client.query(
        `INSERT INTO essential_categories (name, icon, color, display_order) VALUES ($1, $2, $3, $4) RETURNING *`,
        [cat.name, cat.icon, cat.color, cat.order]
      );
      essentialCategories.push(rows[0]);
    }
    console.log('  📂 Created essential categories');

    const essentialServiceData = [
      { catIdx: 0, name: 'Lazz Pharma Gulshan', addr: 'Gulshan-2, Dhaka', lat: 23.7940, lng: 90.4140, phone: '+880-2-9852856' },
      { catIdx: 0, name: 'Square Pharmacy Dhanmondi', addr: 'Dhanmondi 27, Dhaka', lat: 23.7465, lng: 90.3760, phone: '+880-2-9116285' },
      { catIdx: 1, name: 'Shwapno Banani', addr: 'Banani 11, Dhaka', lat: 23.7937, lng: 90.4020, phone: '+880-2-55036700' },
      { catIdx: 1, name: 'Agora Gulshan', addr: 'Gulshan-1, Dhaka', lat: 23.7817, lng: 90.4170, phone: '+880-2-8818088' },
      { catIdx: 2, name: 'United Hospital', addr: 'Gulshan-2, Dhaka', lat: 23.7960, lng: 90.4143, phone: '+880-2-8836000' },
      { catIdx: 2, name: 'Square Hospital', addr: 'Panthapath, Dhaka', lat: 23.7517, lng: 90.3868, phone: '+880-2-8159457' },
      { catIdx: 3, name: 'DBBL ATM Gulshan', addr: 'Gulshan-1 Circle, Dhaka', lat: 23.7810, lng: 90.4150, phone: '+880-2-8331515' },
      { catIdx: 3, name: 'BRAC Bank Uttara', addr: 'Uttara Sector 3, Dhaka', lat: 23.8720, lng: 90.3798, phone: '+880-2-8837775' },
      { catIdx: 4, name: 'Star Kabab Dhanmondi', addr: 'Dhanmondi 15, Dhaka', lat: 23.7470, lng: 90.3745, phone: '+880-2-9114450' },
      { catIdx: 4, name: 'Kacchi Bhai Mirpur', addr: 'Mirpur 10, Dhaka', lat: 23.8095, lng: 90.3680, phone: '+880-1711234567' },
    ];

    for (const s of essentialServiceData) {
      await client.query(
        `INSERT INTO essential_services (category_id, name, address, latitude, longitude, phone, rating, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [essentialCategories[s.catIdx].id, s.name, s.addr, s.lat, s.lng, s.phone, (Math.random() * 1.5 + 3.5).toFixed(1)]
      );
    }
    console.log('  🏪 Created essential services');

    // ===================== EMERGENCY =====================
    const emergCategoryData = [
      { name: 'Police', icon: 'Shield', color: '#1E40AF', priority: 1 },
      { name: 'Fire Service', icon: 'Flame', color: '#DC2626', priority: 2 },
      { name: 'Ambulance', icon: 'Ambulance', color: '#059669', priority: 3 },
      { name: 'Gas Leak', icon: 'Wind', color: '#D97706', priority: 4 },
      { name: "Women's Helpline", icon: 'Phone', color: '#7C3AED', priority: 5 },
      { name: "Child Helpline", icon: 'Baby', color: '#EC4899', priority: 6 },
      { name: 'Flood / Disaster', icon: 'CloudRain', color: '#0EA5E9', priority: 7 },
    ];

    const emergCategories = [];
    for (const cat of emergCategoryData) {
      const { rows } = await client.query(
        `INSERT INTO emergency_categories (name, icon, color, priority_level) VALUES ($1, $2, $3, $4) RETURNING *`,
        [cat.name, cat.icon, cat.color, cat.priority]
      );
      emergCategories.push(rows[0]);
    }
    console.log('  📂 Created emergency categories');

    const emergContactData = [
      // Dhaka
      { catIdx: 0, name: 'Gulshan Police Station', phone1: '999', phone2: '+880-2-9890025', addr: 'Gulshan-2, Dhaka', lat: 23.7928, lng: 90.4148, city: 'Dhaka' },
      { catIdx: 0, name: 'Banani Police Station', phone1: '999', phone2: '+880-2-9874125', addr: 'Banani, Dhaka', lat: 23.7945, lng: 90.4015, city: 'Dhaka' },
      { catIdx: 1, name: 'Dhaka Fire Station (Central)', phone1: '199', phone2: '+880-2-9555555', addr: 'Sadarghat, Dhaka', lat: 23.7082, lng: 90.4070, city: 'Dhaka' },
      { catIdx: 2, name: 'National Ambulance Service', phone1: '199', phone2: '+880-1777777799', addr: 'Dhaka', lat: 23.8103, lng: 90.4125, city: 'Dhaka' },
      { catIdx: 2, name: 'Red Crescent Ambulance', phone1: '+880-2-9116563', phone2: null, addr: 'Mohakhali, Dhaka', lat: 23.7780, lng: 90.4050, city: 'Dhaka' },
      // Rajshahi
      { catIdx: 0, name: 'Katakhali Police Station', phone1: '999', phone2: '+880-721-772224', addr: 'Rajshahi', lat: 24.3739, lng: 88.6011, city: 'Rajshahi' },
      { catIdx: 2, name: 'Rajshahi Medical College Hospital', phone1: '+880-721-776009', phone2: null, addr: 'Rajshahi City', lat: 24.3746, lng: 88.5960, city: 'Rajshahi' },
      { catIdx: 1, name: 'Rajshahi Fire Service', phone1: '199', phone2: '+880-721-775000', addr: 'Rajshahi Fire Station', lat: 24.3700, lng: 88.6050, city: 'Rajshahi' },
      // Chittagong
      { catIdx: 0, name: 'Kotwali Police Station', phone1: '999', phone2: '+880-31-619922', addr: 'Chittagong', lat: 22.3384, lng: 91.8317, city: 'Chittagong' },
      { catIdx: 2, name: 'Chittagong Medical College Hospital', phone1: '+880-31-616891', phone2: null, addr: 'Chittagong City', lat: 22.3569, lng: 91.8340, city: 'Chittagong' },
      // Nationwide
      { catIdx: 3, name: 'Titas Gas Emergency', phone1: '16496', phone2: '+880-2-8900012', addr: 'Nationwide', lat: 23.8103, lng: 90.4125, city: 'Dhaka' },
      { catIdx: 4, name: 'National Women Helpline', phone1: '109', phone2: '+880-2-8900021', addr: 'Nationwide', lat: 23.8103, lng: 90.4125, city: 'Dhaka' },
      { catIdx: 5, name: 'Child Helpline Bangladesh', phone1: '1098', phone2: null, addr: 'Nationwide', lat: 23.8103, lng: 90.4125, city: 'Dhaka' },
    ];

    for (const ec of emergContactData) {
      await client.query(
        `INSERT INTO emergency_contacts (category_id, name, phone_primary, phone_secondary, address, latitude, longitude, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [emergCategories[ec.catIdx].id, ec.name, ec.phone1, ec.phone2, ec.addr, ec.lat, ec.lng, ec.city]
      );
    }
    console.log('  🚨 Created emergency contacts');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('  📧 Test accounts (password: Test@1234):');
    console.log('     Owners: owner1@dummyinbox.com → owner5@dummyinbox.com');
    console.log('     Users:  user1@dummyinbox.com, user2@dummyinbox.com');
    console.log('     🔐 Auth managed by Supabase — check Dashboard → Authentication\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

// End of file

// Start of: ./server\src\app.js
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
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'].filter(Boolean),
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
// Prevent abuse: max 1000 requests per 15 minutes per IP (increased for dev/SPA routing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// ---- API Routes Mounting----
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

// End of file

// Start of: ./server\src\config\cloudinary.js
// =============================================
// Cloudinary Configuration — Image Upload Service
// =============================================
// WHY Cloudinary?
// Storing images on your own server is expensive and slow.
// Cloudinary is a CDN (Content Delivery Network) that:
// - Stores images in the cloud
// - Serves them from servers closest to the user
// - Can resize, crop, optimize images on the fly
// - Handles format conversion (WebP for modern browsers)
//
// The upload() function takes a file path (from Multer)
// and returns a Cloudinary URL you store in your database.
// =============================================

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// End of file

// Start of: ./server\src\config\db.js
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
  ssl: { rejectUnauthorized: false },
  max: 20,                        // Maximum connections in pool
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 5000,  // Timeout if can't connect in 5s
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

// End of file

// Start of: ./server\src\config\email.js
// =============================================
// Email Configuration — Nodemailer + DummyInbox.com
// =============================================
// HOW IT WORKS:
// We send emails TO @dummyinbox.com addresses.
// View received emails at: https://dummyinbox.com/mail/<username>
// Example: owner1@dummyinbox.com → https://dummyinbox.com/mail/owner1
//
// No passwords needed — just visit the URL to see emails!
//
// SENDING METHOD:
// If SMTP credentials are provided in .env → uses that SMTP server
// Otherwise → uses Nodemailer's "direct" transport which sends
// directly to dummyinbox.com's mail server (no relay needed)
//
// In production, set EMAIL_HOST/USER/PASS to a real SMTP provider
// =============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Build transporter based on available config
let transporter;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  // SMTP relay mode (Gmail, SendGrid, Ethereal, etc.)
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  // Direct transport — sends to destination MX server without a relay
  // Perfect for development with dummyinbox.com
  transporter = nodemailer.createTransport({
    direct: true,
  });
}

/**
 * Send an email notification
 * @param {Object} options
 * @param {string} options.to - Recipient email (e.g. owner1@dummyinbox.com)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Nodemailer send result
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const fromAddr = process.env.EMAIL_USER || 'noreply@movemate.app';

    const info = await transporter.sendMail({
      from: `"MoveMate" <${fromAddr}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    console.log(`   View at: https://dummyinbox.com/mail/${to.split('@')[0]}`);
    return info;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    // Don't throw — email failure shouldn't break the main operation
    return null;
  }
};

/**
 * Verify the email transport is working
 */
export const verifyEmailTransport = async () => {
  try {
    if (process.env.EMAIL_HOST) {
      await transporter.verify();
      console.log('📧 Email transport verified (SMTP)');
    } else {
      console.log('📧 Email transport: direct mode (dummyinbox.com)');
      console.log('   View emails at: https://dummyinbox.com/mail/<username>');
    }
  } catch (error) {
    console.warn('⚠️  Email transport not available:', error.message);
  }
};

export default transporter;

// End of file

// Start of: ./server\src\config\supabase.js
// =============================================
// Supabase Server Config
// =============================================
// Two clients:
// - supabaseAdmin: uses service_role key (bypasses RLS, full access)
//   Used for: creating auth users, admin operations
// - supabase: uses anon key (respects RLS)
//   Used for: auth verification, public operations
// =============================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client — bypasses RLS, uses service_role key
// Use for: creating users, managing storage, server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client — uses anon key, respects RLS
// Use for: verifying auth tokens
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseAdmin;

// End of file

// Start of: ./server\src\controllers\auth.controller.js
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
  console.log(data + " " + user + " " + rows)
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
    await supabaseAdmin.auth.admin.signOut(token).catch(() => { });
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

// End of file

// Start of: ./server\src\controllers\booking.controller.js
// =============================================
// Booking Controller — 3 Booking Flows
// =============================================
// The booking_model on the property determines which flow runs:
//
// 1. HOTEL STYLE → Select dates → Price breakdown → Pay Now or Pay at Property
// 2. SHORT TERM  → Instant Book (auto-confirmed) or Request (owner approves)
// 3. LONG TERM   → Express Interest → Owner Schedules Visit → Agreement
//
// Each flow has different status transitions and child records.
// =============================================

import { query, getClient } from '../config/db.js';
import { bookingQueries } from '../queries/booking.queries.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../config/email.js';

/**
 * POST /api/bookings
 * Create a new booking — flow determined by booking_type
 */
// export const createBooking = asyncHandler(async (req, res) => {
//   const {
//     property_id, booking_type, check_in, check_out,
//     guests, total_price, message
//   } = req.body;

//   // Determine initial status based on booking type
//   let status;
//   switch (booking_type) {
//     case 'hotel_pay_now':
//       status = 'confirmed'; // Will become confirmed after payment
//       break;
//     case 'hotel_pay_at_property':
//       status = 'confirmed'; // Confirmed immediately (pay later)
//       break;
//     case 'short_term_instant':
//       status = 'confirmed'; // Instant book = auto confirmed
//       break;
//     case 'short_term_request':
//       status = 'pending'; // Needs owner approval
//       break;
//     case 'long_term_inquiry':
//       status = 'pending'; // Needs owner response
//       break;
//     default:
//       throw new AppError('Invalid booking type', 400);
//   }

//   const client = await getClient();

//   try {
//     await client.query('BEGIN');

//     // Create the booking
//     const { rows } = await client.query(bookingQueries.create, [
//       property_id, req.user.id, booking_type,
//       check_in || null, check_out || null,
//       guests || 1, total_price || null, status, message || null
//     ]);

//     const booking = rows[0];

//     // For short-term request bookings, create a booking request
//     if (booking_type === 'short_term_request') {
//       await client.query(bookingQueries.createRequest, [
//         booking.id, message || 'I would like to book this property.'
//       ]);
//     }

//     await client.query('COMMIT');

//     // Send notification email to owner
//     const propertyResult = await query(
//       `SELECT p.title, p.owner_id, u.email AS owner_email, u.name AS owner_name
//        FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.id = $1`,
//       [property_id]
//     );

//     if (propertyResult.rows[0]) {
//       const prop = propertyResult.rows[0];
//       // Create in-app notification
//       await query(locationQueries.createNotification, [
//         prop.owner_id,
//         'new_booking',
//         'New Booking Request',
//         `You have a new ${booking_type.replace(/_/g, ' ')} booking for "${prop.title}"`,
//         JSON.stringify({ booking_id: booking.id, property_id })
//       ]);

//       // Send email
//       await sendEmail({
//         to: prop.owner_email,
//         subject: `New Booking for "${prop.title}" — MoveMate`,
//         html: `
//           <h2>New Booking Request</h2>
//           <p>Hi ${prop.owner_name},</p>
//           <p>You have a new <strong>${booking_type.replace(/_/g, ' ')}</strong> booking for your property <strong>"${prop.title}"</strong>.</p>
//           <p>Check-in: ${check_in || 'TBD'} | Check-out: ${check_out || 'TBD'}</p>
//           <p>Please log in to MoveMate to review and respond.</p>
//           <br/>
//           <p>— MoveMate Team</p>
//         `,
//       });
//     }

//     res.status(201).json({ success: true, booking });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// });

/**
 * POST /api/bookings
 * Create a new booking — flow determined by booking_type
 */
/**
* POST /api/bookings
* Create a new booking — flow determined by booking_type
*/
export const createBooking = asyncHandler(async (req, res) => {
  const {
    property_id,
    booking_type,
    check_in,
    check_out,
    guests = 1,
    total_price,
    message,
    min_months
  } = req.body;

  // Determine initial status
  let status = 'pending';
  if (booking_type === 'hotel_pay_now' ||
    booking_type === 'hotel_pay_at_property' ||
    booking_type === 'short_term_instant') {
    status = 'confirmed';
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create booking
    const { rows } = await client.query(bookingQueries.create, [
      property_id,
      req.user.id,
      booking_type,
      check_in || null,
      check_out || null,
      guests,
      total_price && total_price > 0 ? total_price : null,
      status,
      message || null,
      booking_type === 'long_term_inquiry' ? (min_months || 6) : null
    ]);

    const booking = rows[0];

    // Optional: Create child record for request flow
    if (booking_type === 'short_term_request') {
      await client.query(bookingQueries.createRequest, [
        booking.id,
        message || 'I would like to book this property.'
      ]);
    }

    await client.query('COMMIT');

    // ===================== SEND NOTIFICATIONS =====================
    const propertyResult = await query(`
      SELECT p.title, p.owner_id, 
             u.name AS owner_name, u.email AS owner_email
      FROM properties p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.id = $1
    `, [property_id]);

    if (propertyResult.rows[0]) {
      const prop = propertyResult.rows[0];

      const bookingTypeLabel = booking_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // In-app notification
      await query(locationQueries.createNotification, [
        prop.owner_id,
        'new_booking',
        'New Booking Request',
        `New ${bookingTypeLabel} for "${prop.title}"`,
        JSON.stringify({ booking_id: booking.id, property_id })
      ]);

      // Email to owner
      let emailBody = `
        <h2>New Booking — ${bookingTypeLabel}</h2>
        <p>Hi ${prop.owner_name},</p>
        <p>You have a new booking request for <strong>"${prop.title}"</strong>.</p>
        <p><strong>Type:</strong> ${bookingTypeLabel}</p>
      `;

      if (check_in) emailBody += `<p><strong>Check-in / Move-in:</strong> ${check_in}</p>`;
      if (check_out) emailBody += `<p><strong>Check-out:</strong> ${check_out}</p>`;
      if (min_months) emailBody += `<p><strong>Minimum Stay:</strong> ${min_months} months</p>`;

      emailBody += `
        <p>Please log in to your MoveMate Owner Dashboard to review and respond.</p>
        <br/>
        <p>— MoveMate Team</p>
      `;

      await sendEmail({
        to: prop.owner_email,
        subject: `New ${bookingTypeLabel} — "${prop.title}" — MoveMate`,
        html: emailBody,
      });
    }

    res.status(201).json({
      success: true,
      booking,
      message: booking_type.includes('inquiry') || booking_type.includes('request')
        ? 'Interest expressed successfully!'
        : 'Booking created successfully!'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking creation error:', error);
    throw new AppError(error.message || 'Failed to create booking', 500);
  } finally {
    client.release();
  }
});
/**
 * GET /api/bookings
 * Get user's bookings (or owner's received bookings)
 */
export const getBookings = asyncHandler(async (req, res) => {
  const { role } = req.query;

  let rows;
  if (role === 'owner' && req.user.role === 'owner') {
    // Get bookings for owner's properties
    const result = await query(bookingQueries.findByOwner, [req.user.id]);
    rows = result.rows;
  } else {
    // Get user's own bookings
    const result = await query(bookingQueries.findByUser, [req.user.id]);
    rows = result.rows;
  }

  res.json({ success: true, bookings: rows });
});

/**
 * GET /api/bookings/:id
 * Get booking detail
 */
export const getBookingDetail = asyncHandler(async (req, res) => {
  const { rows } = await query(bookingQueries.findById, [req.params.id]);

  if (!rows[0]) {
    throw new AppError('Booking not found', 404);
  }

  const booking = rows[0];

  // Only allow the booking user or property owner to view
  if (booking.user_id !== req.user.id && booking.owner_id !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  // Get related data
  const [requestResult, visitsResult, agreementResult, paymentsResult] = await Promise.all([
    query(bookingQueries.getRequest, [booking.id]),
    query(bookingQueries.getVisits, [booking.id]),
    query(bookingQueries.getAgreement, [booking.id]),
    query(bookingQueries.getPayments, [booking.id]),
  ]);

  res.json({
    success: true,
    booking: {
      ...booking,
      request: requestResult.rows[0] || null,
      visits: visitsResult.rows,
      agreement: agreementResult.rows[0] || null,
      payments: paymentsResult.rows,
    },
  });
});

/**
 * PUT /api/bookings/:id/status
 * Owner accepts or rejects a booking
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, owner_response } = req.body;
  const bookingId = req.params.id;

  // Get booking and verify owner
  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);

  const booking = bookingRows[0];
  if (booking.owner_id !== req.user.id) {
    throw new AppError('Not authorized — not the property owner', 403);
  }

  // Update booking status
  await query(bookingQueries.updateStatus, [bookingId, status]);

  // If it's a request booking, update the request too
  if (booking.booking_type === 'short_term_request') {
    await query(bookingQueries.updateRequest, [
      bookingId, owner_response || null, status
    ]);
  }

  // Notify user
  await query(locationQueries.createNotification, [
    booking.user_id,
    'booking_update',
    `Booking ${status}`,
    `Your booking for "${booking.property_title}" has been ${status}.`,
    JSON.stringify({ booking_id: bookingId })
  ]);

  // Send email to user
  await sendEmail({
    to: booking.user_email,
    subject: `Booking ${status} — "${booking.property_title}" — MoveMate`,
    html: `
      <h2>Booking ${status === 'confirmed' ? 'Confirmed ✅' : 'Update'}</h2>
      <p>Hi ${booking.user_name},</p>
      <p>Your booking for <strong>"${booking.property_title}"</strong> has been <strong>${status}</strong>.</p>
      ${owner_response ? `<p>Owner's message: "${owner_response}"</p>` : ''}
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, message: `Booking ${status}` });
});

/**
 * POST /api/bookings/:id/pay
 * Record payment (stubbed — would integrate SSLCommerz)
 */
export const processPayment = asyncHandler(async (req, res) => {
  const { amount, payment_method, timing } = req.body;
  const bookingId = req.params.id;

  // Verify booking belongs to user
  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);
  if (bookingRows[0].user_id !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  // TODO: Integrate SSLCommerz payment gateway
  // For now, simulate successful payment
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { rows } = await query(bookingQueries.createPayment, [
    bookingId, req.user.id, amount, payment_method || 'bkash',
    timing || 'pay_now', 'completed', transactionId
  ]);

  // Update booking status to confirmed if payment successful
  await query(bookingQueries.updateStatus, [bookingId, 'confirmed']);

  // Notify owner
  const booking = bookingRows[0];
  await query(locationQueries.createNotification, [
    booking.owner_id,
    'payment_received',
    'Payment Received',
    `Payment of ৳${amount} received for "${booking.property_title}"`,
    JSON.stringify({ booking_id: bookingId, amount })
  ]);

  await sendEmail({
    to: booking.user_email,
    subject: `Payment Confirmed — MoveMate`,
    html: `
      <h2>Payment Confirmed ✅</h2>
      <p>Your payment of <strong>৳${amount}</strong> for <strong>"${booking.property_title}"</strong> has been confirmed.</p>
      <p>Transaction ID: ${transactionId}</p>
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, payment: rows[0] });
});

/**
 * POST /api/bookings/:id/visit
 * Schedule a property visit (long-term flow)
 */
export const scheduleVisit = asyncHandler(async (req, res) => {
  const { scheduled_at, notes } = req.body;
  const bookingId = req.params.id;

  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);
  if (bookingRows[0].owner_id !== req.user.id) {
    throw new AppError('Only the property owner can schedule visits', 403);
  }

  const { rows } = await query(bookingQueries.createVisit, [
    bookingId, scheduled_at, notes || null
  ]);

  // Update booking status
  await query(bookingQueries.updateStatus, [bookingId, 'confirmed']);

  // Notify user
  await query(locationQueries.createNotification, [
    bookingRows[0].user_id,
    'visit_scheduled',
    'Visit Scheduled',
    `A visit has been scheduled for "${bookingRows[0].property_title}" on ${scheduled_at}`,
    JSON.stringify({ booking_id: bookingId })
  ]);

  await sendEmail({
    to: bookingRows[0].user_email,
    subject: `Visit Scheduled — "${bookingRows[0].property_title}" — MoveMate`,
    html: `
      <h2>Visit Scheduled 📅</h2>
      <p>Hi ${bookingRows[0].user_name},</p>
      <p>A visit has been scheduled for <strong>"${bookingRows[0].property_title}"</strong>.</p>
      <p>Date/Time: <strong>${scheduled_at}</strong></p>
      ${notes ? `<p>Notes: ${notes}</p>` : ''}
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, visit: rows[0] });
});

/**
 * POST /api/bookings/:id/agreement
 * Create rental agreement (long-term flow)
 */
export const createAgreement = asyncHandler(async (req, res) => {
  const {
    deposit_amount, advance_amount, monthly_rent,
    contract_start, contract_end, document_url
  } = req.body;
  const bookingId = req.params.id;

  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);
  if (bookingRows[0].owner_id !== req.user.id) {
    throw new AppError('Only the property owner can create agreements', 403);
  }

  const { rows } = await query(bookingQueries.createAgreement, [
    bookingId, deposit_amount, advance_amount, monthly_rent,
    contract_start, contract_end, document_url || null
  ]);

  // Update booking status to contracted
  await query(bookingQueries.updateStatus, [bookingId, 'contracted']);

  // Notify user
  await query(locationQueries.createNotification, [
    bookingRows[0].user_id,
    'agreement_created',
    'Rental Agreement Created',
    `A rental agreement has been created for "${bookingRows[0].property_title}"`,
    JSON.stringify({ booking_id: bookingId })
  ]);

  await sendEmail({
    to: bookingRows[0].user_email,
    subject: `Rental Agreement — "${bookingRows[0].property_title}" — MoveMate`,
    html: `
      <h2>Rental Agreement Created 📝</h2>
      <p>Hi ${bookingRows[0].user_name},</p>
      <p>A rental agreement has been created for <strong>"${bookingRows[0].property_title}"</strong>.</p>
      <p>Monthly Rent: ৳${monthly_rent}</p>
      <p>Contract: ${contract_start} to ${contract_end}</p>
      <p>Please log in to MoveMate to review and accept.</p>
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, agreement: rows[0] });
});

// End of file

// Start of: ./server\src\controllers\emergency.controller.js
// =============================================
// Emergency Controller — Emergency Contacts
// =============================================
// CRITICAL: This is a public endpoint — no login required.
// Emergency contacts must be accessible to everyone.
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/emergency
 * Get emergency contacts by location or city
 * Query params: lat, lng (for location-based) OR city (fallback)
 */
export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const { lat, lng, city } = req.query;

  let result;
  if (lat && lng) {
    result = await query(locationQueries.getEmergencyContacts, [
      parseFloat(lat), parseFloat(lng)
    ]);
    
    // If the spatial query finds 0 nearby contacts, fallback to nationwide
    if (result.rows.length === 0) {
      result = await query(locationQueries.getAllEmergencyContacts);
    }
  } else if (city) {
    result = await query(locationQueries.getEmergencyByCity, [city]);
  } else {
    // Default: return all active contacts nationwide
    result = await query(locationQueries.getAllEmergencyContacts);
  }

  res.json({ success: true, contacts: result.rows });
});

/**
 * GET /api/emergency/categories
 * Get all emergency categories (ordered by priority)
 */
export const getEmergencyCategories = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getEmergencyCategories);
  res.json({ success: true, categories: rows });
});

/**
 * POST /api/emergency/report
 * Report a wrong number
 */
export const reportContact = asyncHandler(async (req, res) => {
  const { contact_id, reason } = req.body;
  console.log(`🚨 Emergency report: Contact ${contact_id} — ${reason}`);
  res.json({ success: true, message: 'Report submitted. We will verify within 24 hours.' });
});

// End of file

// Start of: ./server\src\controllers\essentials.controller.js
// =============================================
// Essentials Controller — Nearby Services
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/essentials
 * Get nearby essential services
 * Query params: lat, lng, radius (km), category (UUID)
 */
export const getNearbyServices = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5, category } = req.query;

  if (!lat || !lng) {
    throw new AppError('Latitude and longitude are required', 400);
  }

  let result;
  if (category) {
    result = await query(locationQueries.getNearbyServicesByCategory, [
      parseFloat(lat), parseFloat(lng), parseFloat(radius), category
    ]);
  } else {
    result = await query(locationQueries.getNearbyServices, [
      parseFloat(lat), parseFloat(lng), parseFloat(radius)
    ]);
  }

  res.json({ success: true, services: result.rows });
});

/**
 * GET /api/essentials/categories
 * Get all essential service categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getEssentialCategories);
  res.json({ success: true, categories: rows });
});

/**
 * POST /api/essentials/report
 * Report incorrect info for a service
 */
export const reportService = asyncHandler(async (req, res) => {
  const { service_id, reason, details } = req.body;

  // For now, log the report. In production, store in a reports table.
  console.log(`📋 Service report: ${service_id} — ${reason}: ${details}`);

  res.json({ success: true, message: 'Report submitted. Thank you!' });
});

/**
 * GET /api/essentials/geocode
 * Proxy to Nominatim Reverse Geocoding API to bypass CORS
 * Query params: lat, lng
 */
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw new AppError('Latitude and longitude are required', 400);
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'MoveMateV1/1.0 (Contact: support@movemate.local)' // Required by Nominatim Policy
      }
    });

    if (!response.ok) {
        throw new AppError(`Nominatim API error: ${response.statusText}`, response.status);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Nominatim Proxy Error:', err);
    throw new AppError('Failed to geocode address', 500);
  }
});

// End of file

// Start of: ./server\src\controllers\notification.controller.js
// =============================================
// Notification Controller
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/notifications
 * Get user's notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getUserNotifications, [req.user.id]);
  const countResult = await query(locationQueries.getUnreadCount, [req.user.id]);

  res.json({
    success: true,
    notifications: rows,
    unread_count: parseInt(countResult.rows[0].count),
  });
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.markAsRead, [req.params.id, req.user.id]);
  res.json({ success: true, notification: rows[0] });
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export const markAllRead = asyncHandler(async (req, res) => {
  await query(locationQueries.markAllRead, [req.user.id]);
  res.json({ success: true, message: 'All notifications marked as read' });
});

// End of file

// Start of: ./server\src\controllers\property.controller.js
// =============================================
// Property Controller — CRUD + Image Upload
// =============================================
// KEY CONCEPT: Owner Contact Gating
// The property detail endpoint checks if the request is authenticated.
// - Authenticated: returns owner name, email, phone, avatar
// - Guest: returns only owner name and avatar (NO phone/email)
// This is enforced HERE at the API level, not just hidden in frontend.
// =============================================

import { query, getClient } from '../config/db.js';
import { propertyQueries } from '../queries/property.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * GET /api/properties
 * List properties with dynamic filters
 */
export const listProperties = asyncHandler(async (req, res) => {
  const {
    type, minPrice, maxPrice, city, bedrooms,
    lat, lng, radius, guests, page = 1, limit = 12, sort
  } = req.query;

  // Start with base query and build WHERE clauses dynamically
  let sql = propertyQueries.listBase;
  const params = [];
  let paramCount = 0;

  // Add filters
  if (type) {
    paramCount++;
    sql += ` AND p.property_type = $${paramCount}`;
    params.push(type);
  }

  if (minPrice) {
    paramCount++;
    sql += ` AND p.base_price >= $${paramCount}`;
    params.push(minPrice);
  }

  if (maxPrice) {
    paramCount++;
    sql += ` AND p.base_price <= $${paramCount}`;
    params.push(maxPrice);
  }

  if (city) {
    paramCount++;
    sql += ` AND LOWER(p.city) = LOWER($${paramCount})`;
    params.push(city);
  }

  if (bedrooms) {
    paramCount++;
    sql += ` AND p.bedrooms >= $${paramCount}`;
    params.push(bedrooms);
  }

  if (guests) {
    paramCount++;
    sql += ` AND p.max_guests >= $${paramCount}`;
    params.push(guests);
  }

  // Location radius filter (uses earthdistance)
  if (lat && lng && radius) {
    paramCount++;
    const latParam = paramCount;
    paramCount++;
    const lngParam = paramCount;
    paramCount++;
    const radiusParam = paramCount;
    sql += ` AND earth_box(ll_to_earth($${latParam}, $${lngParam}), $${radiusParam} * 1000) @> ll_to_earth(p.latitude, p.longitude)
             AND earth_distance(ll_to_earth($${latParam}, $${lngParam}), ll_to_earth(p.latitude, p.longitude)) <= $${radiusParam} * 1000`;
    params.push(lat, lng, radius);
  }

  // Sorting
  switch (sort) {
    case 'price_low':
      sql += ' ORDER BY p.base_price ASC';
      break;
    case 'price_high':
      sql += ' ORDER BY p.base_price DESC';
      break;
    case 'rating':
      sql += ' ORDER BY avg_rating DESC';
      break;
    default:
      sql += ' ORDER BY p.created_at DESC';
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(parseInt(limit));
  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const { rows } = await query(sql, params);

  // Get total count for pagination
  let countSql = `SELECT COUNT(*) FROM properties p WHERE p.status = 'active'`;
  // Re-apply filters for count (simplified)
  const countParams = [];
  let countParamIdx = 0;
  if (type) { countParamIdx++; countSql += ` AND p.property_type = $${countParamIdx}`; countParams.push(type); }
  if (minPrice) { countParamIdx++; countSql += ` AND p.base_price >= $${countParamIdx}`; countParams.push(minPrice); }
  if (maxPrice) { countParamIdx++; countSql += ` AND p.base_price <= $${countParamIdx}`; countParams.push(maxPrice); }
  if (city) { countParamIdx++; countSql += ` AND LOWER(p.city) = LOWER($${countParamIdx})`; countParams.push(city); }

  const countResult = await query(countSql, countParams);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    properties: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * GET /api/properties/featured
 * Get featured listings for homepage
 */
export const getFeatured = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  const { rows } = await query(propertyQueries.featured, [parseInt(limit)]);
  res.json({ success: true, properties: rows });
});

/**
 * GET /api/properties/:id
 * Get property detail — owner contact shown only to authenticated users
 */
export const getPropertyDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Use different query based on authentication
  const queryText = req.user
    ? propertyQueries.detailAuth
    : propertyQueries.detailGuest;

  const { rows } = await query(queryText, [id]);

  if (!rows[0]) {
    throw new AppError('Property not found', 404);
  }

  // Get images, amenities, rules
  const [images, amenities, rules] = await Promise.all([
    query(propertyQueries.getImages, [id]),
    query(propertyQueries.getAmenities, [id]),
    query(propertyQueries.getRules, [id]),
  ]);

  const property = {
    ...rows[0],
    images: images.rows,
    amenities: amenities.rows,
    rules: rules.rows,
  };

  res.json({ success: true, property });
});

/**
 * POST /api/properties
 * Create a new property (owner only)
 */
export const createProperty = asyncHandler(async (req, res) => {
  const {
    title, description, property_type, booking_model,
    address, city, latitude, longitude, bedrooms, bathrooms,
    area_sqft, max_guests, base_price, price_unit,
    instant_book, amenities, rules
  } = req.body;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create property
    const { rows } = await client.query(propertyQueries.create, [
      req.user.id, title, description, property_type, booking_model,
      address, city || 'Dhaka', latitude, longitude,
      bedrooms || 1, bathrooms || 1, area_sqft || null,
      max_guests || 2, base_price, price_unit, instant_book || false, 'active'
    ]);

    const property = rows[0];

    // Add amenities
    if (amenities && Array.isArray(amenities)) {
      for (const name of amenities) {
        await client.query(propertyQueries.addAmenity, [property.id, name]);
      }
    }

    // Add rules
    if (rules && Array.isArray(rules)) {
      for (const ruleText of rules) {
        await client.query(propertyQueries.addRule, [property.id, ruleText]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ success: true, property });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/properties/:id
 * Update a property (owner only)
 */
// export const updateProperty = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     title, description, property_type, booking_model,
//     address, city, latitude, longitude, bedrooms, bathrooms,
//     area_sqft, max_guests, base_price, price_unit,
//     instant_book, status, amenities, rules
//   } = req.body;

//   const client = await getClient();

//   try {
//     await client.query('BEGIN');

//     const { rows } = await client.query(propertyQueries.update, [
//       id, title, description, property_type, booking_model,
//       address, city, latitude, longitude, bedrooms, bathrooms,
//       area_sqft, max_guests, base_price, price_unit,
//       instant_book, status || 'active', req.user.id
//     ]);

//     if (!rows[0]) {
//       throw new AppError('Property not found or not authorized', 404);
//     }

//     // Replace amenities
//     if (amenities && Array.isArray(amenities)) {
//       await client.query(propertyQueries.deleteAmenities, [id]);
//       for (const name of amenities) {
//         await client.query(propertyQueries.addAmenity, [id, name]);
//       }
//     }

//     // Replace rules
//     if (rules && Array.isArray(rules)) {
//       await client.query(propertyQueries.deleteRules, [id]);
//       for (const ruleText of rules) {
//         await client.query(propertyQueries.addRule, [id, ruleText]);
//       }
//     }

//     await client.query('COMMIT');

//     res.json({ success: true, property: rows[0] });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// });

/**
 * PATCH /api/properties/:id
 * Update property (partial + amenities/rules)
 */
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title, description, property_type, booking_model,
    address, city, latitude, longitude, bedrooms, bathrooms,
    area_sqft, max_guests, base_price, price_unit,
    instant_book, status,
    amenities, rules
  } = req.body;

  console.log(`🔄 Updating property ${id} by user ${req.user.id}`);
  console.log('📥 Received fields:', Object.keys(req.body).filter(k => req.body[k] !== undefined));

  const client = await getClient();
  // ==================== CRITICAL: Verify this user owns this property ====================
  const { rows: ownershipCheck } = await client.query(
    `SELECT owner_id FROM properties WHERE id = $1`,
    [id]
  );

  if (ownershipCheck.length === 0) {
    throw new AppError('Property not found', 404);
  }

  if (ownershipCheck[0].owner_id !== req.user.id) {
    console.log(`🚫 Unauthorized access attempt: User ${req.user.id} tried to modify property owned by ${ownershipCheck[0].owner_id}`);
    throw new AppError('You can only update your own properties', 403);
  }

  console.log(`✅ Ownership verified`);
  try {
    await client.query('BEGIN');

    let updated = false;

    // ===================== 1. UPDATE MAIN PROPERTY FIELDS =====================
    const fieldMap = {
      title, description, property_type, booking_model,
      address, city, latitude, longitude, bedrooms, bathrooms,
      area_sqft, max_guests, base_price, price_unit,
      instant_book, status
    };

    const setClauses = [];
    const params = [id, req.user.id]; // $1 = id, $2 = owner_id
    let paramIndex = 3;

    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined && value !== null) {
        setClauses.push(`${field} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length > 0) {
      const queryText = `
        UPDATE properties 
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $1 AND owner_id = $2
        RETURNING *
      `;

      console.log('📤 Executing UPDATE:', queryText);
      console.log('📤 Parameters:', params);

      const { rows, rowCount } = await client.query(queryText, params);

      console.log(`✅ Main fields updated — rows affected: ${rowCount}`);

      if (rowCount === 0) {
        throw new AppError('Property not found or you are not the owner', 403);
      }
      updated = true;
    }

    // ===================== 2. UPDATE AMENITIES (full replace) =====================
    if (amenities !== undefined) {
      await client.query(propertyQueries.deleteAmenities, [id]);

      if (Array.isArray(amenities) && amenities.length > 0) {
        for (const name of amenities) {
          if (name?.trim()) {
            await client.query(propertyQueries.addAmenity, [id, name.trim()]);
          }
        }
      }
      console.log(`✅ Amenities updated (${amenities.length} items)`);
      updated = true;
    }

    // ===================== 3. UPDATE RULES (full replace) =====================
    if (rules !== undefined) {
      await client.query(propertyQueries.deleteRules, [id]);

      if (Array.isArray(rules) && rules.length > 0) {
        for (const ruleText of rules) {
          if (ruleText?.trim()) {
            await client.query(propertyQueries.addRule, [id, ruleText.trim()]);
          }
        }
      }
      console.log(`✅ Rules updated (${rules.length} items)`);
      updated = true;
    }

    if (!updated) {
      throw new AppError('No fields were provided to update', 400);
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');

    // ===================== FETCH FRESH DATA =====================
    const [propRes, amenRes, ruleRes] = await Promise.all([
      query('SELECT * FROM properties WHERE id = $1', [id]),
      query('SELECT name FROM property_amenities WHERE property_id = $1 ORDER BY name', [id]),
      query('SELECT rule_text FROM property_rules WHERE property_id = $1 ORDER BY rule_text', [id])
    ]);

    const freshProperty = {
      ...propRes.rows[0],
      amenities: amenRes.rows.map(a => a.name),
      rules: ruleRes.rows.map(r => r.rule_text)
    };

    console.log('📤 Returning fresh data →', freshProperty.title);

    res.json({
      success: true,
      message: 'Property updated successfully',
      property: freshProperty
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
});



/**
 * 
 * DELETE /api/properties/:id
 * Delete a property (owner only)
 */
// export const deleteProperty = asyncHandler(async (req, res) => {
//   const { rows } = await query(propertyQueries.delete, [req.params.id, req.user.id]);

//   if (!rows[0]) {
//     throw new AppError('Property not found or not authorized', 404);
//   }

//   res.json({ success: true, message: 'Property deleted' });
// });

/**
 * DELETE /api/properties/:id
 * Soft delete with safety checks (Standard Approach)
 */
// export const deleteProperty = asyncHandler(async (req, res) => {
//   const propertyId = req.params.id;
//   const userId = req.user.id;

//   const client = await getClient();

//   try {
//     await client.query('BEGIN');

//     // Verify ownership
//     const { rows: prop } = await client.query(
//       `SELECT owner_id FROM properties WHERE id = $1 AND deleted_at IS NULL`,
//       [propertyId]
//     );

//     if (prop.length === 0) {
//       throw new AppError('Property not found or already deleted', 404);
//     }
//     if (prop[0].owner_id !== userId) {
//       throw new AppError('You can only delete your own properties', 403);
//     }

//     // Check for future/active bookings
//     const { rows: futureBookings } = await client.query(`
//       SELECT id FROM bookings 
//       WHERE property_id = $1 
//         AND check_in >= CURRENT_DATE 
//         AND status NOT IN ('cancelled', 'rejected')
//     `, [propertyId]);

//     if (futureBookings.length > 0) {
//       throw new AppError(
//         'Cannot delete this property. It has upcoming or active bookings. Please cancel them first.',
//         400
//       );
//     }

//     // Soft delete the property
//     await client.query(
//       `UPDATE properties 
//        SET deleted_at = NOW(), 
//            status = 'deleted' 
//        WHERE id = $1 AND owner_id = $2`,
//       [propertyId, userId]
//     );

//     // Clean up non-critical data
//     await client.query(`DELETE FROM property_images WHERE property_id = $1`, [propertyId]);
//     await client.query(`DELETE FROM property_amenities WHERE property_id = $1`, [propertyId]);
//     await client.query(`DELETE FROM property_rules WHERE property_id = $1`, [propertyId]);
//     await client.query(`DELETE FROM saved_listings WHERE property_id = $1`, [propertyId]);

//     await client.query('COMMIT');

//     res.json({
//       success: true,
//       message: 'Property has been deleted successfully. Past bookings and reviews are preserved.'
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// });
/**
 * DELETE /api/properties/:id
 * Soft delete with safety checks (Standard Approach)
 */
export const deleteProperty = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;
  const userId = req.user.id;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const { rows: prop } = await client.query(
      `SELECT owner_id FROM properties WHERE id = $1 AND deleted_at IS NULL`,
      [propertyId]
    );

    if (prop.length === 0) {
      throw new AppError('Property not found or already deleted', 404);
    }
    if (prop[0].owner_id !== userId) {
      throw new AppError('You can only delete your own properties', 403);
    }

    // Check for future/active bookings
    const { rows: futureBookings } = await client.query(`
      SELECT id FROM bookings 
      WHERE property_id = $1 
        AND check_in >= CURRENT_DATE 
        AND status NOT IN ('cancelled', 'rejected')
    `, [propertyId]);

    if (futureBookings.length > 0) {
      throw new AppError(
        'Cannot delete this property. It has upcoming or active bookings. Please cancel them first.',
        400
      );
    }

    // Soft delete the property
    await client.query(
      `UPDATE properties 
       SET deleted_at = NOW(), 
           status = 'deleted' 
       WHERE id = $1 AND owner_id = $2`,
      [propertyId, userId]
    );

    // Clean up non-critical data
    await client.query(`DELETE FROM property_images WHERE property_id = $1`, [propertyId]);
    await client.query(`DELETE FROM property_amenities WHERE property_id = $1`, [propertyId]);
    await client.query(`DELETE FROM property_rules WHERE property_id = $1`, [propertyId]);
    await client.query(`DELETE FROM saved_listings WHERE property_id = $1`, [propertyId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Property has been deleted successfully. Past bookings and reviews are preserved.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
/**
 * POST /api/properties/:id/images
 * Upload property images to Supabase Storage
 */
export const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    throw new AppError('No images provided', 400);
  }

  const uploadedImages = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const ext = file.originalname.split('.').pop();
    const fileName = `${id}/${Date.now()}_${i}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('property-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('property-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Save to DB
    const isPrimary = i === 0 && uploadedImages.length === 0;
    const { rows } = await query(propertyQueries.addImage, [
      id, publicUrl, isPrimary, i
    ]);

    uploadedImages.push(rows[0]);
  }

  res.status(201).json({ success: true, images: uploadedImages });
});

/**
 * DELETE /api/properties/:id/images/:imageId
 * Remove a property image from DB and Supabase Storage
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  // Get the image URL before deleting
  const { rows: imageRows } = await query(
    'SELECT url FROM property_images WHERE id = $1 AND property_id = $2',
    [imageId, id]
  );

  const { rows } = await query(propertyQueries.deleteImage, [imageId, id]);

  if (!rows[0]) {
    throw new AppError('Image not found', 404);
  }

  // Try to delete from Supabase Storage (best-effort)
  if (imageRows[0]?.url?.includes('supabase')) {
    const path = imageRows[0].url.split('/property-images/')[1];
    if (path) {
      await supabaseAdmin.storage.from('property-images').remove([path]).catch(() => { });
    }
  }

  res.json({ success: true, message: 'Image deleted' });
});

/**
 * GET /api/properties/owner/my-listings
 * Get properties owned by the current user
 */
export const getMyListings = asyncHandler(async (req, res) => {
  const { rows } = await query(propertyQueries.getByOwner, [req.user.id]);
  res.json({ success: true, properties: rows });
});

// End of file

// Start of: ./server\src\controllers\review.controller.js
// =============================================
// Review Controller
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../config/email.js';

/**
 * POST /api/reviews
 * Submit a review (requires a completed booking)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { property_id, booking_id, rating, comment } = req.body;

  if (!property_id || !booking_id || !rating) {
    throw new AppError('Property ID, booking ID, and rating are required', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Verify booking belongs to user and is completed
  const bookingResult = await query(
    `SELECT b.*, p.title AS property_title, p.owner_id
     FROM bookings b JOIN properties p ON b.property_id = p.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [booking_id, req.user.id]
  );

  if (!bookingResult.rows[0]) {
    throw new AppError('Booking not found or not yours', 404);
  }

  const booking = bookingResult.rows[0];

  // Check for duplicate review
  const existingReview = await query(
    'SELECT id FROM reviews WHERE booking_id = $1',
    [booking_id]
  );
  if (existingReview.rows.length > 0) {
    throw new AppError('You already reviewed this booking', 409);
  }

  // Create review
  const { rows } = await query(locationQueries.createReview, [
    property_id, req.user.id, booking_id, rating, comment || null
  ]);

  // Notify property owner
  await query(locationQueries.createNotification, [
    booking.owner_id,
    'new_review',
    'New Review',
    `Your property "${booking.property_title}" received a ${rating}-star review.`,
    JSON.stringify({ property_id, review_id: rows[0].id })
  ]);

  // Get owner email for notification
  const ownerResult = await query('SELECT email, name FROM users WHERE id = $1', [booking.owner_id]);
  if (ownerResult.rows[0]) {
    await sendEmail({
      to: ownerResult.rows[0].email,
      subject: `New ${rating}★ Review — "${booking.property_title}" — MoveMate`,
      html: `
        <h2>New Review ⭐</h2>
        <p>Hi ${ownerResult.rows[0].name},</p>
        <p>Your property <strong>"${booking.property_title}"</strong> received a <strong>${rating}-star</strong> review.</p>
        ${comment ? `<p>"${comment}"</p>` : ''}
        <br/><p>— MoveMate Team</p>
      `,
    });
  }

  res.status(201).json({ success: true, review: rows[0] });
});

/**
 * GET /api/reviews/property/:propertyId
 * Get all reviews for a property
 */
export const getPropertyReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getByProperty, [req.params.propertyId]);

  // Calculate rating breakdown
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  rows.forEach(r => {
    breakdown[r.rating]++;
    totalRating += r.rating;
  });

  res.json({
    success: true,
    reviews: rows,
    summary: {
      count: rows.length,
      average: rows.length > 0 ? (totalRating / rows.length).toFixed(1) : 0,
      breakdown,
    },
  });
});

/**
 * PUT /api/reviews/:id
 * Edit own review (rating + comment only — booking/property are immutable)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    throw new AppError('Rating is required', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Fetch the review and verify ownership in one shot
  const existing = await query(
    `SELECT r.*, p.title AS property_title, p.owner_id
     FROM reviews r
     JOIN properties p ON r.property_id = p.id
     WHERE r.id = $1`,
    [id]
  );

  if (!existing.rows[0]) {
    throw new AppError('Review not found', 404);
  }

  if (existing.rows[0].reviewer_id !== req.user.id) {
    throw new AppError('You can only edit your own reviews', 403);
  }

  const review = existing.rows[0];

  // Update review
  const { rows } = await query(
    `UPDATE reviews
     SET rating = $1, comment = $2
     WHERE id = $3
     RETURNING *`,
    [rating, comment || null, id]
  );

  // Notify property owner about the edit
  await query(locationQueries.createNotification, [
    review.owner_id,
    'review_updated',
    'Review Updated',
    `A guest updated their review on "${review.property_title}" to ${rating} stars.`,
    JSON.stringify({ property_id: review.property_id, review_id: id }),
  ]);

  res.json({ success: true, review: rows[0] });
});

/**
 * GET /api/reviews/eligibility/:propertyId
 * Check if the current user has a confirmed booking to allow reviewing,
 * and fetch their existing review if they have one.
 */
export const checkEligibility = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  // 1. Check if user has a valid booking for this property
  const bookingCheck = await query(
    `SELECT id FROM bookings
     WHERE user_id = $1 AND property_id = $2 
       AND status IN ('confirmed', 'completed')
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, propertyId]
  );

  if (bookingCheck.rows.length === 0) {
    return res.json({ success: true, canReview: false });
  }

  const bookingId = bookingCheck.rows[0].id;

  // 2. Check if they already wrote a review
  const reviewCheck = await query(
    `SELECT * FROM reviews 
     WHERE reviewer_id = $1 AND property_id = $2`,
    [req.user.id, propertyId]
  );

  return res.json({
    success: true,
    canReview: true,
    bookingId,
    existingReview: reviewCheck.rows[0] || null
  });
});

// End of file

// Start of: ./server\src\controllers\stripe.controller.js
// ./server/src/controllers/stripe.controller.js
import Stripe from 'stripe';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { query } from '../config/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripeSession = asyncHandler(async (req, res) => {
    const { booking_id, amount } = req.body;

    if (!booking_id) {
        throw new AppError('booking_id is required', 400);
    }

    if (!amount || amount <= 0) {
        throw new AppError('Valid amount is required for payment', 400);
    }

    // Verify booking belongs to user
    const { rows } = await query(`
    SELECT b.id, b.booking_type, p.title 
    FROM bookings b 
    JOIN properties p ON b.property_id = p.id 
    WHERE b.id = $1 AND b.user_id = $2
  `, [booking_id, req.user.id]);

    if (rows.length === 0) {
        throw new AppError('Booking not found or not authorized', 404);
    }

    const booking = rows[0];

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'bdt',
                    product_data: {
                        name: booking.title || 'MoveMate Booking',
                        description: `Booking #${booking_id}`,
                    },
                    unit_amount: Math.round(amount),
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&booking_id=${booking_id}`,
        cancel_url: `${process.env.CLIENT_URL}/bookings/${booking_id}?payment=cancelled`,
        metadata: { booking_id: booking_id.toString() },
    });

    res.json({
        success: true,
        id: session.id,
        url: session.url,        // This is the important part
    });
});
// End of file

// Start of: ./server\src\middleware\auth.js
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

// End of file

// Start of: ./server\src\middleware\errorHandler.js
// =============================================
// Global Error Handler Middleware
// =============================================
// WHY: Express requires a special 4-argument middleware for errors.
// When any route calls next(error) or throws, Express skips all
// remaining middleware and jumps directly to this error handler.
//
// This centralizes error responses so you don't need try/catch
// in every single controller — just throw or next(error).
// =============================================

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  // Determine status code — default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Custom error class with status code
 * Usage: throw new AppError('Not found', 404);
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Async handler wrapper — catches errors and passes to error handler
 * Use this to wrap async controller functions so you don't need try/catch
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => {
 *     const { rows } = await query('SELECT * FROM users');
 *     res.json(rows);
 *   }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// End of file

// Start of: ./server\src\middleware\upload.js
// =============================================
// Multer Upload Middleware — File Upload Handling
// =============================================
// WHY Multer?
// Express doesn't handle file uploads natively.
// Multer parses multipart/form-data (the encoding used for file uploads)
// and saves files temporarily to disk or memory.
//
// We use memoryStorage (files stay in RAM as Buffer) because:
// - We're uploading immediately to Supabase Storage
// - We don't need to persist files locally
// - Simpler cleanup (no temp files on disk)
//
// Limits protect against abuse:
// - 5MB max file size
// - Only image MIME types allowed
// - Max 10 files per upload
// =============================================

import multer from 'multer';

// Store files in memory (Buffer) — no temp files on disk
const storage = multer.memoryStorage();

// Filter: only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accept the file
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max per file
    files: 10,                   // Max 10 files per request
  },
});

export default upload;

// End of file

// Start of: ./server\src\queries\booking.queries.js
// =============================================
// Booking SQL Queries
// =============================================

export const bookingQueries = {
  // Create a booking
  create: `
    INSERT INTO bookings (property_id, user_id, booking_type, check_in, check_out, guests, total_price, status, message, min_months)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `,

  // Get booking by ID with property and user info
  findById: `
    SELECT b.*,
      p.title AS property_title, p.address AS property_address,
      p.base_price, p.price_unit, p.booking_model, p.owner_id,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS property_image,
      u.name AS user_name, u.email AS user_email, u.phone AS user_phone
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u ON b.user_id = u.id
    WHERE b.id = $1
  `,

  // Get bookings by user
  findByUser: `
    SELECT b.*,
      p.title AS property_title, p.address AS property_address,
      p.base_price, p.price_unit,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS property_image
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
  `,

  // Get bookings for owner's properties
  findByOwner: `
    SELECT b.*,
      p.title AS property_title, p.address AS property_address,
      u.name AS user_name, u.email AS user_email, u.phone AS user_phone
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u ON b.user_id = u.id
    WHERE p.owner_id = $1
    ORDER BY b.created_at DESC
  `,

  // Update booking status
  updateStatus: `
    UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *
  `,

  // Create booking request (for short-term non-instant)
  createRequest: `
    INSERT INTO booking_requests (booking_id, user_message, status)
    VALUES ($1, $2, 'pending')
    RETURNING *
  `,

  // Get booking request
  getRequest: `
    SELECT * FROM booking_requests WHERE booking_id = $1
  `,

  // Update booking request (owner responds)
  updateRequest: `
    UPDATE booking_requests SET owner_response = $2, status = $3, responded_at = NOW()
    WHERE booking_id = $1
    RETURNING *
  `,

  // Create rental visit (long-term)
  createVisit: `
    INSERT INTO rental_visits (booking_id, scheduled_at, notes)
    VALUES ($1, $2, $3)
    RETURNING *
  `,

  // Get visits for a booking
  getVisits: `
    SELECT * FROM rental_visits WHERE booking_id = $1 ORDER BY scheduled_at ASC
  `,

  // Update visit status
  updateVisit: `
    UPDATE rental_visits SET status = $2, notes = $3 WHERE id = $1 RETURNING *
  `,

  // Create rental agreement (long-term)
  createAgreement: `
    INSERT INTO rental_agreements (booking_id, deposit_amount, advance_amount, monthly_rent,
      contract_start, contract_end, document_url, signed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `,

  // Get agreement for a booking
  getAgreement: `
    SELECT * FROM rental_agreements WHERE booking_id = $1
  `,

  // Create payment
  createPayment: `
    INSERT INTO payments (booking_id, payer_id, amount, payment_method, timing, status, transaction_id, paid_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `,

  // Get payments for a booking
  getPayments: `
    SELECT * FROM payments WHERE booking_id = $1 ORDER BY paid_at DESC
  `,
};

// End of file

// Start of: ./server\src\queries\location.queries.js
// =============================================
// Location SQL Queries — Essentials + Emergency
// =============================================
// These queries use PostgreSQL earthdistance extension
// to find services/contacts within a radius of a point.
//
// HOW SPATIAL QUERIES WORK:
// 1. ll_to_earth(lat, lng) converts lat/lng → 3D point on Earth
// 2. earth_distance(point1, point2) → distance in METERS
// 3. earth_box(center, radius) → bounding box for index scan
// 4. The @> operator checks if a point is inside the box
// 5. We double-check with earth_distance for precision
//    (bounding box is rectangular, but radius is circular)
//
// This two-step approach is fast AND accurate:
// Step 1 (earth_box @>): Eliminates 99% of rows using the GiST index
// Step 2 (earth_distance <=): Precise circle check on remaining rows
// =============================================

export const locationQueries = {
  // === ESSENTIALS ===

  // Get all essential categories
  getEssentialCategories: `
    SELECT * FROM essential_categories ORDER BY display_order ASC
  `,

  // Get nearby essential services within radius
  // $1 = latitude, $2 = longitude, $3 = radius in km
  getNearbyServices: `
    SELECT
      s.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(s.latitude, s.longitude)
      ) / 1000 AS distance_km
    FROM essential_services s
    JOIN essential_categories c ON s.category_id = c.id
    WHERE
      earth_box(ll_to_earth($1, $2), $3 * 1000) @> ll_to_earth(s.latitude, s.longitude)
      AND earth_distance(ll_to_earth($1, $2), ll_to_earth(s.latitude, s.longitude)) <= $3 * 1000
    ORDER BY distance_km ASC
    LIMIT 50
  `,

  // Get nearby services filtered by category
  getNearbyServicesByCategory: `
    SELECT
      s.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(s.latitude, s.longitude)
      ) / 1000 AS distance_km
    FROM essential_services s
    JOIN essential_categories c ON s.category_id = c.id
    WHERE
      earth_box(ll_to_earth($1, $2), $3 * 1000) @> ll_to_earth(s.latitude, s.longitude)
      AND earth_distance(ll_to_earth($1, $2), ll_to_earth(s.latitude, s.longitude)) <= $3 * 1000
      AND s.category_id = $4
    ORDER BY distance_km ASC
    LIMIT 50
  `,

  // === EMERGENCY ===

  // Get all emergency categories (ordered by priority)
  getEmergencyCategories: `
    SELECT * FROM emergency_categories ORDER BY priority_level ASC
  `,

  // Get emergency contacts by location
  getEmergencyContacts: `
    SELECT
      ec.*,
      cat.name AS category_name,
      cat.icon AS category_icon,
      cat.color AS category_color,
      cat.priority_level,
      earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(ec.latitude, ec.longitude)
      ) / 1000 AS distance_km
    FROM emergency_contacts ec
    JOIN emergency_categories cat ON ec.category_id = cat.id
    WHERE ec.is_active = true
      AND earth_box(ll_to_earth($1, $2), 50 * 1000) @> ll_to_earth(ec.latitude, ec.longitude)
    ORDER BY cat.priority_level ASC, distance_km ASC
  `,

  // Get emergency contacts by city (fallback if no location)
  getEmergencyByCity: `
    SELECT ec.*, cat.name AS category_name, cat.icon AS category_icon,
      cat.color AS category_color, cat.priority_level
    FROM emergency_contacts ec
    JOIN emergency_categories cat ON ec.category_id = cat.id
    WHERE ec.is_active = true AND ec.city = $1
    ORDER BY cat.priority_level ASC
  `,

  // Get ALL emergency contacts nationwide (ultimate fallback)
  getAllEmergencyContacts: `
    SELECT ec.*, cat.name AS category_name, cat.icon AS category_icon,
      cat.color AS category_color, cat.priority_level
    FROM emergency_contacts ec
    JOIN emergency_categories cat ON ec.category_id = cat.id
    WHERE ec.is_active = true
    ORDER BY cat.priority_level ASC
  `,

  // === NOTIFICATIONS ===

  getUserNotifications: `
    SELECT * FROM notifications WHERE user_id = $1
    ORDER BY created_at DESC LIMIT 50
  `,

  getUnreadCount: `
    SELECT COUNT(*) AS count FROM notifications
    WHERE user_id = $1 AND is_read = false
  `,

  markAsRead: `
    UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2
    RETURNING *
  `,

  markAllRead: `
    UPDATE notifications SET is_read = true WHERE user_id = $1
  `,

  createNotification: `
    INSERT INTO notifications (user_id, type, title, body, payload)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  // === REVIEWS ===

  createReview: `
    INSERT INTO reviews (property_id, reviewer_id, booking_id, rating, comment)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  getByProperty: `
    SELECT r.*, u.name AS reviewer_name, up.avatar_url AS reviewer_avatar
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE r.property_id = $1
    ORDER BY r.created_at DESC
  `,

  // === SAVED LISTINGS ===

  saveListing: `
    INSERT INTO saved_listings (user_id, property_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, property_id) DO NOTHING
    RETURNING *
  `,

  unsaveListing: `
    DELETE FROM saved_listings WHERE user_id = $1 AND property_id = $2
    RETURNING *
  `,

  getSavedListings: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      sl.created_at AS saved_at
    FROM saved_listings sl
    JOIN properties p ON sl.property_id = p.id
    WHERE sl.user_id = $1
    ORDER BY sl.created_at DESC
  `,

  isSaved: `
    SELECT id FROM saved_listings WHERE user_id = $1 AND property_id = $2
  `,
};

// End of file

// Start of: ./server\src\queries\property.queries.js
// =============================================
// Property SQL Queries
// =============================================

export const propertyQueries = {
  // Create a new property
  create: `
    INSERT INTO properties (owner_id, title, description, property_type, booking_model,
      address, city, latitude, longitude, bedrooms, bathrooms, area_sqft, max_guests,
      base_price, price_unit, instant_book, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `,

  // List properties with filters
  // This is built dynamically in the controller based on query params
  listBase: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count,
      u.name AS owner_name
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.status = 'active' AND p.deleted_at IS NULL
  `,

  // Get single property detail (for authenticated users — includes owner contact)
  detailAuth: `
    SELECT p.*,
      u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
      up.avatar_url AS owner_avatar,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `,

  // Get single property detail (for guests — NO owner phone/email)
  detailGuest: `
    SELECT p.*,
      u.name AS owner_name,
      up.avatar_url AS owner_avatar,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `,

  // Get images for a property
  getImages: `
    SELECT * FROM property_images
    WHERE property_id = $1
    ORDER BY display_order ASC
  `,


  // Add image
  addImage: `
    INSERT INTO property_images (property_id, url, is_primary, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,

  // Delete image
  deleteImage: `
    DELETE FROM property_images WHERE id = $1 AND property_id = $2
    RETURNING *
  `,

  // Get amenities
  getAmenities: `SELECT * FROM property_amenities WHERE property_id = $1`,

  // Add amenity
  addAmenity: `
    INSERT INTO property_amenities (property_id, name) VALUES ($1, $2) RETURNING *
  `,

  // Delete all amenities (for update — delete then re-insert)
  deleteAmenities: `DELETE FROM property_amenities WHERE property_id = $1`,

  // Get rules
  getRules: `SELECT * FROM property_rules WHERE property_id = $1`,
  // Add rule
  addRule: `
    INSERT INTO property_rules (property_id, rule_text) VALUES ($1, $2) RETURNING *
  `,

  // Delete all rules
  deleteRules: `DELETE FROM property_rules WHERE property_id = $1`,

  // Update property
  update: `
    UPDATE properties SET
      title = $2, description = $3, property_type = $4, booking_model = $5,
      address = $6, city = $7, latitude = $8, longitude = $9, bedrooms = $10,
      bathrooms = $11, area_sqft = $12, max_guests = $13, base_price = $14,
      price_unit = $15, instant_book = $16, status = $17
    WHERE id = $1 AND owner_id = $18 AND deleted_at IS NULL
    RETURNING *
  `,
  // Update the database partially
  updatePartial: `
    UPDATE properties 
    SET ${'placeholder'} , updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING *
  `,
  // Delete property → Soft Delete
  softDelete: `
    UPDATE properties 
    SET deleted_at = NOW(), 
        status = 'deleted',
        updated_at = NOW()
    WHERE id = $1 AND owner_id = $2 
      AND deleted_at IS NULL
    RETURNING id, title
  `,

  // Delete property (owner only)
  // delete: `DELETE FROM properties WHERE id = $1 AND owner_id = $2 RETURNING *`,

  // Get properties by owner
  getByOwner: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count
    FROM properties p
    WHERE p.owner_id = $1 AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `,

  // Featured (latest active properties)
  featured: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count,
      u.name AS owner_name
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.status = 'active' AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT $1
  `,
};

// End of file

// Start of: ./server\src\queries\user.queries.js
// =============================================
// User SQL Queries — Supabase Auth Compatible
// =============================================
// auth_id links our users table to Supabase's auth.users
// password_hash is no longer stored (managed by Supabase Auth)
// =============================================

export const userQueries = {
  // Find user by email
  findByEmail: `
    SELECT id, name, email, phone, role, is_verified, auth_id, created_at
    FROM users WHERE email = $1
  `,

  // Find user by Supabase auth ID
  findByAuthId: `
    SELECT id, name, email, phone, role, is_verified, created_at
    FROM users WHERE auth_id = $1
  `,

  // Find user by ID
  findById: `
    SELECT id, name, email, phone, role, is_verified, created_at
    FROM users WHERE id = $1
  `,

  // Create a new user (no password_hash — Supabase handles auth)
  create: `
    INSERT INTO users (name, email, phone, role, auth_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, phone, role, is_verified, created_at
  `,

  // Get user with profile
  findWithProfile: `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified, u.created_at,
           p.avatar_url, p.latitude, p.longitude, p.current_city
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = $1
  `,

  // Create or update user profile (upsert)
  upsertProfile: `
    INSERT INTO user_profiles (user_id, avatar_url, latitude, longitude, current_city)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET
      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
      latitude = COALESCE(EXCLUDED.latitude, user_profiles.latitude),
      longitude = COALESCE(EXCLUDED.longitude, user_profiles.longitude),
      current_city = COALESCE(EXCLUDED.current_city, user_profiles.current_city),
      updated_at = NOW()
    RETURNING *
  `,

  // Update user info
  update: `
    UPDATE users SET name = $2, phone = $3 WHERE id = $1
    RETURNING id, name, email, phone, role, is_verified
  `,
};

// End of file

// Start of: ./server\src\routes\auth.routes.js
// Auth Routes
import { Router } from 'express';
import { register, login, getMe, refreshToken, logout, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/refresh', refreshToken);
router.put('/profile', protect, updateProfile);

export default router;

// End of file

// Start of: ./server\src\routes\booking.routes.js
// Booking Routes
import { Router } from 'express';
import {
  createBooking, getBookings, getBookingDetail,
  updateBookingStatus, processPayment,
  scheduleVisit, createAgreement
} from '../controllers/booking.controller.js';
import { protect, ownerOnly } from '../middleware/auth.js';
import { createStripeSession } from '../controllers/stripe.controller.js';
const router = Router();

router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingDetail);
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);
router.post('/:id/pay', protect, processPayment);
router.post('/:id/visit', protect, ownerOnly, scheduleVisit);
router.post('/:id/agreement', protect, ownerOnly, createAgreement);
router.post('/create-stripe-session', protect, createStripeSession);

export default router;

// End of file

// Start of: ./server\src\routes\emergency.routes.js
// Emergency Routes — ALL PUBLIC (no login required)
import { Router } from 'express';
import { getEmergencyContacts, getEmergencyCategories, reportContact } from '../controllers/emergency.controller.js';

const router = Router();

router.get('/', getEmergencyContacts);
router.get('/categories', getEmergencyCategories);
router.post('/report', reportContact);

export default router;

// End of file

// Start of: ./server\src\routes\essentials.routes.js
// Essentials Routes
import { Router } from 'express';
import { getNearbyServices, getCategories, reportService, reverseGeocode } from '../controllers/essentials.controller.js';

const router = Router();

// All essentials routes are public
router.get('/', getNearbyServices);
router.get('/categories', getCategories);
router.get('/geocode', reverseGeocode);
router.post('/report', reportService);

export default router;

// End of file

// Start of: ./server\src\routes\notification.routes.js
// Notification Routes
import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

export default router;

// End of file

// Start of: ./server\src\routes\property.routes.js
// Property Routes
import { Router } from 'express';
import {
  listProperties, getFeatured, getPropertyDetail,
  createProperty, updateProperty, deleteProperty,
  uploadImages, deleteImage, getMyListings
} from '../controllers/property.controller.js';
import { protect, ownerOnly, optionalAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', listProperties);
router.get('/featured', getFeatured);

// Owner routes (must come BEFORE /:id to avoid route conflict)
router.get('/owner/my-listings', protect, ownerOnly, getMyListings);
router.post('/', protect, ownerOnly, createProperty);

// Property detail — uses optionalAuth to gate owner contact info
router.get('/:id', optionalAuth, getPropertyDetail);

// Owner-only property management
// router.put('/:id', protect, ownerOnly, updateProperty);
router.patch('/:id', protect, ownerOnly, updateProperty);
router.delete('/:id', protect, ownerOnly, deleteProperty);

// Image management
router.post('/:id/images', protect, ownerOnly, upload.array('images', 10), uploadImages);
router.delete('/:id/images/:imageId', protect, ownerOnly, deleteImage);

export default router;

// End of file

// Start of: ./server\src\routes\review.routes.js
// Review Routes
import { Router } from 'express';
import { createReview, getPropertyReviews, updateReview, checkEligibility } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createReview);
router.get('/property/:propertyId', getPropertyReviews);
router.get('/eligibility/:propertyId', protect, checkEligibility);
router.put('/:id', protect, updateReview);

export default router;

// End of file

