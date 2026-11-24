-- 017_tour_tickets_and_check_in.sql
-- E-ticket QR and group check-in for confirmed tour orders (docs/architecture/signature-features.md, mục 3).
-- Run AFTER 016.
--
-- 1) tour_tickets: one ticket per tour order item, created the first time the customer opens it.
--    ticket_code is random and opaque (never derived from an id). The QR holds only
--    "SH1.<ticket_code>.<version>.<HMAC-SHA256 signature>" — no name, phone or booking id.
--    The signing key lives in configuration (Ticket:SigningKey), never in the database, so a database copy alone
--    cannot forge a QR. Raising version voids every QR issued before it.
-- 2) passenger_check_ins: at most one row per passenger (primary key), so a repeated or concurrent scan fails on
--    the key and the API answers 409. Undoing a check-in deletes the row; who did what stays in audit_logs.
--    booking_item_id is copied from booking_passengers on insert so a departure's board is one indexed join.
--
-- Not re-runnable as a whole (CREATE TABLE fails the second time); run once per database.

SET NAMES utf8mb4;

CREATE TABLE tour_tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_item_id BIGINT UNSIGNED NOT NULL,
  ticket_code CHAR(12) NOT NULL COMMENT 'random Crockford base32, shown on the ticket and inside the QR',
  version SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'signed into the QR; raise it to void older QR codes',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'UTC',
  CONSTRAINT uq_tour_tickets_item UNIQUE (booking_item_id),
  CONSTRAINT uq_tour_tickets_code UNIQUE (ticket_code),
  CONSTRAINT fk_tour_tickets_item FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  CONSTRAINT ck_tour_tickets_version CHECK (version > 0)
) ENGINE=InnoDB;

CREATE TABLE passenger_check_ins (
  passenger_id BIGINT UNSIGNED PRIMARY KEY,
  booking_item_id BIGINT UNSIGNED NOT NULL,
  checked_in_by BIGINT UNSIGNED NOT NULL,
  checked_in_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'UTC',
  CONSTRAINT fk_check_ins_passenger FOREIGN KEY (passenger_id) REFERENCES booking_passengers(id),
  CONSTRAINT fk_check_ins_item FOREIGN KEY (booking_item_id) REFERENCES booking_items(id),
  CONSTRAINT fk_check_ins_actor FOREIGN KEY (checked_in_by) REFERENCES users(id),
  INDEX ix_check_ins_item (booking_item_id)
) ENGINE=InnoDB;
