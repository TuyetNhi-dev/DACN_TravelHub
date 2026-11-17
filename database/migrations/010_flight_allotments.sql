-- 010_flight_allotments.sql
-- Flight deals: SàiHành holds a contracted seat allotment on some partner quotes. A quote with an allotment is a
-- "deal": it is confirmed as soon as the customer pays within the hold, like a tour seat, with no partner check.
-- A quote without an allotment (allotment_seats IS NULL) keeps the old flow: wait for partner confirmation.
-- Run AFTER 009 on the operator-selected database.
--
-- No booking column is needed: a flight order holds allotment seats exactly when it has a hold deadline
-- (bookings.hold_expires_at, migration 008), and flight_booking_details.flight_offer_id already says which quote
-- the seats come from.

ALTER TABLE flight_offers
  ADD COLUMN allotment_seats SMALLINT UNSIGNED NULL AFTER quoted_price,
  ADD COLUMN sold_seats SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER allotment_seats,
  ADD CONSTRAINT chk_flight_offers_allotment CHECK (
    (allotment_seats IS NULL AND sold_seats = 0)
    OR (allotment_seats IS NOT NULL AND sold_seats <= allotment_seats)),
  ADD INDEX idx_flight_offers_allotment (allotment_seats, status);
