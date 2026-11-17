-- 008_simulated_payment.sql
-- Simulated payment (decision 2026-11-17; a VNPAY sandbox comes later):
--   Tour: seats are held until bookings.hold_expires_at (server time + a configured number of minutes).
--         Paying in time confirms the order; a background job cancels expired holds and returns the seats.
--   Hotel/flight: staff confirm with the partner first (item -> awaiting_payment), then the customer pays.
-- Run AFTER 007 on the operator-selected database.

ALTER TABLE bookings
  ADD COLUMN hold_expires_at DATETIME(6) NULL AFTER total,
  ADD INDEX idx_bookings_hold_expiry (hold_expires_at);

ALTER TABLE booking_items
  MODIFY COLUMN status ENUM('pending','awaiting_supplier','awaiting_payment','confirmed','cancelled','completed',
    'failed') NOT NULL DEFAULT 'pending';

-- Tour orders created before this change hold seats with no deadline. Give them a 24-hour grace period
-- (UTC, like every DATETIME here) instead of cancelling them the moment the expiry job starts.
UPDATE bookings b
JOIN booking_items i ON i.booking_id = b.id
SET b.hold_expires_at = UTC_TIMESTAMP(6) + INTERVAL 24 HOUR
WHERE i.service_type = 'tour' AND i.status = 'pending' AND b.hold_expires_at IS NULL;
