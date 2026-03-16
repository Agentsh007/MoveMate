-- =============================================
-- Migration 007: Emergency Contacts
-- =============================================
-- WHY: Emergency contacts are safety-critical and must work
-- even offline (cached on frontend). The coverage_radius_km
-- indicates the geographic area each contact serves.
--
-- Same spatial indexing as essentials for "nearest police station" queries.
-- =============================================

CREATE TABLE emergency_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  icon           VARCHAR(100),
  color          VARCHAR(20),
  priority_level SMALLINT DEFAULT 5
);

CREATE TABLE emergency_contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES emergency_categories(id),
  name                VARCHAR(255) NOT NULL,
  phone_primary       VARCHAR(30) NOT NULL,
  phone_secondary     VARCHAR(30),
  address             TEXT,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  coverage_radius_km  NUMERIC(5,2) DEFAULT 5,
  city                VARCHAR(100) NOT NULL,
  country             VARCHAR(100) DEFAULT 'Bangladesh',
  is_active           BOOLEAN DEFAULT TRUE
);

-- Spatial index for fast location-based queries
CREATE INDEX idx_emergency_location
  ON emergency_contacts USING gist (
    ll_to_earth(latitude, longitude)
  );
