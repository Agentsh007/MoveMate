-- =============================================
-- Migration 008: Notifications + Saved Listings
-- =============================================
-- WHY: Notifications are stored in DB so they persist across
-- sessions. The JSONB payload column allows flexible data
-- (e.g., booking ID, property title) without extra columns.
--
-- Saved listings let users bookmark properties they like.
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  payload    JSONB,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'booking_request',
    'booking_confirmed',
    'booking_rejected',
    'payment_received',
    'payment_failed',
    'visit_scheduled',
    'agreement_signed',
    'review_received',
    'general_alert'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index for fast "get unread notifications for user" queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_read = FALSE;

-- Saved/bookmarked listings
CREATE TABLE IF NOT EXISTS saved_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, property_id)  -- Can't save same property twice
);

-- Moving waitlist (passive "Need help moving?" email collection)
CREATE TABLE IF NOT EXISTS moving_waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
