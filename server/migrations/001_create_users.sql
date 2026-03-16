-- =============================================
-- Migration 001: Users & User Profiles
-- =============================================
-- WHY: Users are the foundation — every other table references them.
-- We use UUID primary keys (gen_random_uuid) instead of serial IDs
-- for better security (can't guess IDs) and distributed systems.
--
-- ENUM types define strict allowed values at the database level,
-- much safer than just using VARCHAR.
-- =============================================

-- Enable UUID generation (built into PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the allowed user roles
-- 'user' = renter, 'owner' = property owner, 'admin' = platform admin
CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255),
  role          user_role NOT NULL DEFAULT 'user',
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Separate profile table for optional/editable user data
-- One-to-one with users via UNIQUE constraint on user_id
CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url   TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  current_city VARCHAR(255),
  updated_at   TIMESTAMP DEFAULT NOW()
);
