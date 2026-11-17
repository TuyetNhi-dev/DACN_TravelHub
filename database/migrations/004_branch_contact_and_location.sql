-- 004_branch_contact_and_location.sql
-- Adds what the public office directory (/branches) shows: map coordinates, phone and opening hours.
-- All columns are nullable: a branch without coordinates is listed but not pinned on the map.
-- Run AFTER 003 on the operator-selected database.

ALTER TABLE branches
  ADD COLUMN latitude DECIMAL(9,6) NULL AFTER address,
  ADD COLUMN longitude DECIMAL(9,6) NULL AFTER latitude,
  ADD COLUMN phone VARCHAR(20) NULL AFTER longitude,
  ADD COLUMN opening_hours VARCHAR(60) NULL AFTER phone,
  ADD CONSTRAINT chk_branches_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT chk_branches_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
