-- =============================================
-- Migration 003: Bookings, Requests, Visits, Agreements
-- =============================================
-- WHY: Bookings are complex because we have 3 different flows.
-- Instead of 3 separate booking tables, we use ONE bookings table
-- with a booking_type ENUM, and child tables for flow-specific data:
--   - booking_requests: for short-term non-instant bookings
--   - rental_visits: for long-term property visits
--   - rental_agreements: for long-term contracts
--
-- The status ENUM tracks the full lifecycle from draft → completed.
-- =============================================

DO $$ BEGIN
  CREATE TYPE booking_type AS ENUM (
    'hotel_pay_now',
    'hotel_pay_at_property',
    'long_term_inquiry',
    'short_term_instant',
    'short_term_request'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'draft',
    'pending',
    'confirmed',
    'rejected',
    'visited',
    'contracted',
    'cancelled',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  booking_type booking_type NOT NULL,
  check_in     DATE,
  check_out    DATE,
  guests       INT DEFAULT 1,
  total_price  NUMERIC(10, 2),
  status       booking_status DEFAULT 'draft',
  message      TEXT,       -- User's message to owner
  created_at   TIMESTAMP DEFAULT NOW(),
  min_months INTEGER 
);

-- For short-term request bookings: tracks owner response
CREATE TABLE IF NOT EXISTS booking_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_message   TEXT,
  owner_response TEXT,
  status         VARCHAR(50) DEFAULT 'pending',
  responded_at   TIMESTAMP
);

-- For long-term: scheduled property visits
CREATE TABLE IF NOT EXISTS rental_visits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP,
  status       VARCHAR(50) DEFAULT 'scheduled',
  notes        TEXT
);

-- For long-term: formal rental agreement after visit
CREATE TABLE IF NOT EXISTS rental_agreements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  deposit_amount  NUMERIC(10, 2),
  advance_amount  NUMERIC(10, 2),
  monthly_rent    NUMERIC(10, 2),
  contract_start  DATE,
  contract_end    DATE,
  document_url    TEXT,
  signed_at       TIMESTAMP
);
