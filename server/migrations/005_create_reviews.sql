-- =============================================
-- Migration 005: Reviews
-- =============================================
-- WHY: Reviews require a completed booking — this prevents
-- fake reviews. The booking_id reference ensures the reviewer
-- actually stayed at the property.
--
-- CHECK constraint enforces rating between 1-5 at DB level.
-- =============================================

DO $$ BEGIN
  CREATE TYPE review_target AS ENUM ('property', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  booking_id  UUID NOT NULL REFERENCES bookings(id),
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
