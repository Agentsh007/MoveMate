-- =============================================
-- Migration 001: Users & User Profiles (Supabase Auth)
-- =============================================
-- Uses auth_id (UUID) to link to Supabase auth.users
-- password_hash is no longer stored here — Supabase manages credentials
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DO block to create enum only if it doesn't exist (safe for Supabase re-runs)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id       UUID UNIQUE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  role          user_role NOT NULL DEFAULT 'user',
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url   TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  current_city VARCHAR(255),
  updated_at   TIMESTAMP DEFAULT NOW()
);
