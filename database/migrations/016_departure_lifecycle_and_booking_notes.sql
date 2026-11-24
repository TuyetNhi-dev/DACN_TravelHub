-- 016_departure_lifecycle_and_booking_notes.sql
-- Back office, second step (docs/architecture/admin-spec.md, decision 003). Run AFTER 015.
--
-- 1) tour_departures.status gains the trip's life after sales:
--      open (on sale) <-> closed (sale paused) -> guaranteed ("chốt đoàn", no more sales) -> in_progress -> completed,
--    and any state before in_progress may end in cancelled. Only 'open' is ever bookable, so the customer site keeps
--    working unchanged. A cancellation keeps its reason and time (cancel_reason, cancelled_at, UTC).
-- 2) tours.cancellation_policy and tours.travel_notes: the "Chính sách" tab of the tour editor.
-- 3) booking_notes: internal notes staff write on an order. Never shown to the customer. The audit log records
--    that a note was added, not its text.
--
-- Not re-runnable as a whole (ADD COLUMN / CREATE TABLE fail the second time); run once per database.

SET NAMES utf8mb4;

ALTER TABLE tour_departures
  MODIFY COLUMN status ENUM('open','closed','guaranteed','in_progress','completed','cancelled')
    NOT NULL DEFAULT 'open',
  ADD COLUMN cancel_reason VARCHAR(500) NULL AFTER status,
  ADD COLUMN cancelled_at DATETIME(6) NULL AFTER cancel_reason COMMENT 'UTC';

ALTER TABLE tours
  ADD COLUMN cancellation_policy TEXT NULL AFTER description,
  ADD COLUMN travel_notes TEXT NULL AFTER cancellation_policy;

CREATE TABLE booking_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  body VARCHAR(1000) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'UTC',
  CONSTRAINT fk_booking_notes_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_booking_notes_author FOREIGN KEY (author_user_id) REFERENCES users(id),
  INDEX ix_booking_notes_booking (booking_id, created_at)
) ENGINE=InnoDB;
