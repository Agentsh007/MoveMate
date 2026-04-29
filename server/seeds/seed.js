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
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1494526585095-c1bfa7075ae8?w=800',
      'https://images.unsplash.com/photo-1512918755499-eb9b52b45148?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800',
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800',
      'https://images.unsplash.com/photo-1505843513577-22bb7abd5eb1?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800',
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
        // Shift through the massive array of images so properties get completely unique or widely diverse sets
        const imageIndex = (i * 5 + j) % imageUrls.length;

        await client.query(
          `INSERT INTO property_images (property_id, url, is_primary, display_order) VALUES ($1, $2, $3, $4)`,
          [property.id, imageUrls[imageIndex], j === 0, j]
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
