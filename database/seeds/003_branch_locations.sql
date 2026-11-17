-- 003_branch_locations.sql
-- DEMO office locations for the 4 demo branches in seeds/002 (requires migrations/004).
-- Coordinates are city-centre landmarks, not real SàiHành offices; the phone is the shared hotline.
SET NAMES utf8mb4;
START TRANSACTION;

UPDATE branches SET latitude = 21.028511, longitude = 105.852020, phone = '19006886',
  opening_hours = '8:00 - 21:00' WHERE code = 'HN';
UPDATE branches SET latitude = 16.061433, longitude = 108.227013, phone = '19006886',
  opening_hours = '8:00 - 21:00' WHERE code = 'DN';
UPDATE branches SET latitude = 10.776889, longitude = 106.700806, phone = '19006886',
  opening_hours = '8:00 - 22:00' WHERE code = 'HCM';
UPDATE branches SET latitude = 10.034150, longitude = 105.787993, phone = '19006886',
  opening_hours = '8:00 - 21:00' WHERE code = 'CT';

COMMIT;
