-- =============================================
-- Migration 002: Properties & Related Tables
-- =============================================
-- WHY: Properties are the core entity. Each property has:
-- - A type (hotel, flat, apartment, etc.)
-- - A booking model that determines the flow
-- - Images, amenities, and rules as child tables
--
-- We store lat/lng directly for spatial queries later.
-- =============================================

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('hotel', 'flat', 'apartment', 'sublet', 'tolet', 'room');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_model AS ENUM ('hotel_style', 'short_term', 'long_term');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE price_unit AS ENUM ('per_night', 'per_month');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('active', 'inactive', 'pending_review', 'deleted');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS properties (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  property_type  property_type NOT NULL,
  booking_model  booking_model NOT NULL,
  address        VARCHAR(500) NOT NULL,
  city           VARCHAR(100) DEFAULT 'Dhaka',
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  bedrooms       INT DEFAULT 1,
  bathrooms      INT DEFAULT 1,
  area_sqft      INT,
  max_guests     INT DEFAULT 2,
  base_price     NUMERIC(10, 2) NOT NULL,
  price_unit     price_unit NOT NULL,
  instant_book   BOOLEAN DEFAULT FALSE,
  status         property_status DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  deleted_at     TIMESTAMP WITH TIME ZONE
);

-- Multiple images per property — display_order controls carousel order
CREATE TABLE IF NOT EXISTS property_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  is_primary    BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0
);

-- Amenities as individual rows (flexible, queryable)
CREATE TABLE IF NOT EXISTS property_amenities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL
);

-- Owner-defined rules for tenants
CREATE TABLE IF NOT EXISTS property_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rule_text   TEXT NOT NULL
);
