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

CREATE TYPE booking_type AS ENUM (
  'hotel_pay_now',           -- Hotel: user pays immediately
  'hotel_pay_at_property',   -- Hotel: user pays at check-in
  'long_term_inquiry',       -- Long-term: inquiry → visit → agreement
  'short_term_instant',      -- Short-term: instant book
  'short_term_request'       -- Short-term: request → owner approval
);

CREATE TYPE booking_status AS ENUM (
  'draft',        -- User started but didn't submit
  'pending',      -- Awaiting owner response
  'confirmed',    -- Owner accepted or instant-booked
  'rejected',     -- Owner declined
  'visited',      -- Long-term: visit completed
  'contracted',   -- Long-term: agreement signed
  'cancelled',    -- User or owner cancelled
  'completed'     -- Stay finished
);

CREATE TABLE bookings (
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
  created_at   TIMESTAMP DEFAULT NOW()
);

-- For short-term request bookings: tracks owner response
CREATE TABLE booking_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_message   TEXT,
  owner_response TEXT,
  status         VARCHAR(50) DEFAULT 'pending',
  responded_at   TIMESTAMP
);

-- For long-term: scheduled property visits
CREATE TABLE rental_visits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP,
  status       VARCHAR(50) DEFAULT 'scheduled',
  notes        TEXT
);

-- For long-term: formal rental agreement after visit
CREATE TABLE rental_agreements (
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
