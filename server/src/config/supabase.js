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
