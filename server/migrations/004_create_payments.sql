-- =============================================
-- Migration 004: Payments
-- =============================================
-- WHY: Payments are separate from bookings because:
-- 1. A booking can have multiple payments (deposit + rent)
-- 2. Payment can happen at different times (now, at property, after agreement)
-- 3. Different methods (bKash, Nagad, card, cash)
--
-- The timing ENUM tells us WHEN payment happens in the flow.
-- The status tracks whether it's pending, completed, failed, or refunded.
-- =============================================

CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'rocket', 'card', 'cash');
CREATE TYPE payment_timing AS ENUM ('pay_now', 'pay_at_property', 'pay_after_agreement');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL REFERENCES bookings(id),
  payer_id       UUID NOT NULL REFERENCES users(id),
  amount         NUMERIC(10, 2) NOT NULL,
  currency       CHAR(3) DEFAULT 'BDT',
  payment_method payment_method NOT NULL,
  timing         payment_timing NOT NULL,
  status         payment_status DEFAULT 'pending',
  transaction_id VARCHAR(255),
  paid_at        TIMESTAMP
);
