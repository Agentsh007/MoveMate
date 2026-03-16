-- =============================================
-- Migration 006: Essentials (Nearby Services)
-- =============================================
-- WHY: The Essentials module shows nearby pharmacies, hospitals,
-- groceries, etc. We need spatial indexing to efficiently query
-- "what's within X km of my location?"
--
-- PostgreSQL extensions used:
-- - cube: provides the cube data type for multi-dimensional points
-- - earthdistance: uses cube to calculate great-circle distances
-- - ll_to_earth(lat, lng): converts lat/lng to a 3D earth point
-- - earth_distance(): calculates distance between two earth points
-- - earth_box(): creates a bounding box for fast index scans
--
-- The GiST index on ll_to_earth enables fast "nearby" queries.
-- Without it, PG would scan every row to compute distances.
-- =============================================

CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE TABLE essential_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(100),
  color         VARCHAR(20),
  display_order INT DEFAULT 0
);

CREATE TABLE essential_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES essential_categories(id),
  name        VARCHAR(255) NOT NULL,
  address     TEXT,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  phone       VARCHAR(30),
  website     TEXT,
  rating      NUMERIC(2,1),
  is_verified BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Spatial GiST index for fast radius queries
-- This allows earth_box() to use the index instead of full table scan
CREATE INDEX idx_essential_location
  ON essential_services USING gist (
    ll_to_earth(latitude, longitude)
  );
