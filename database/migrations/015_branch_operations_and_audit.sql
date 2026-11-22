-- 015_branch_operations_and_audit.sql
-- Multi-branch back office (docs/architecture/admin-spec.md, decision 003). Run AFTER 014.
--
-- 1) tour_departures.operating_branch_id: the branch that runs THIS departure (a tour of the Hà Nội branch can
--    also leave from Đà Nẵng with the Đà Nẵng branch). Existing rows take the tour's branch. New tour orders record
--    this branch as bookings.selling_branch_id, and admin scopes filter departures by it.
-- 2) tour_departures.min_guests: below this head count a departure is flagged "chưa đủ khách" on the dashboard.
-- 3) audit_logs: append-only record of every write made in the back office, written in the same transaction as
--    the change. No IP address and no secrets are stored.
-- 4) An index for the dashboard's "orders today / this month" counts per branch.
--
-- MySQL Workbench: the two backfill UPDATEs filter on the primary key, so safe-update mode accepts them.

SET NAMES utf8mb4;

ALTER TABLE tour_departures
  ADD COLUMN operating_branch_id BIGINT UNSIGNED NULL AFTER tour_id,
  ADD COLUMN min_guests SMALLINT UNSIGNED NOT NULL DEFAULT 10 AFTER capacity;

UPDATE tour_departures d JOIN tours t ON t.id = d.tour_id
SET d.operating_branch_id = t.operating_branch_id
WHERE d.id > 0;

-- A few small departures may hold fewer seats than the default minimum.
UPDATE tour_departures SET min_guests = LEAST(min_guests, capacity) WHERE id > 0;

ALTER TABLE tour_departures
  MODIFY COLUMN operating_branch_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_tour_departures_branch FOREIGN KEY (operating_branch_id) REFERENCES branches(id),
  ADD CONSTRAINT chk_tour_departures_min_guests CHECK (min_guests >= 1 AND min_guests <= capacity),
  ADD INDEX idx_departures_branch_date (operating_branch_id, departure_date);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(60) NOT NULL COMMENT 'e.g. tour.update, departure.bulk_create, booking.confirm',
  entity_type VARCHAR(40) NOT NULL COMMENT 'tour | departure | booking | service_request | staff_assignment',
  entity_id VARCHAR(64) NOT NULL,
  branch_id BIGINT UNSIGNED NULL COMMENT 'branch of the changed object, used for scope filtering',
  region_id BIGINT UNSIGNED NULL,
  summary VARCHAR(500) NOT NULL COMMENT 'Vietnamese sentence shown in the log',
  changes JSON NULL COMMENT '{"field": [old, new]}; never passwords, tokens or secrets',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'UTC',
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  CONSTRAINT fk_audit_logs_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_audit_logs_region FOREIGN KEY (region_id) REFERENCES regions(id),
  INDEX ix_audit_created (created_at),
  INDEX ix_audit_entity (entity_type, entity_id),
  INDEX ix_audit_branch (branch_id, created_at),
  INDEX ix_audit_region (region_id, created_at)
) ENGINE=InnoDB;

CREATE INDEX idx_bookings_branch_created ON bookings (selling_branch_id, created_at);
