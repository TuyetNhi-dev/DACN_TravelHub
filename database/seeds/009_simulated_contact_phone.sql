-- 009_simulated_contact_phone.sql
-- seeds/003 gave every DEMO branch the hotline 1900 6886. A 1900 number is a commercial number that may belong to
-- a real company, so the branches now show the clearly simulated number used across the site
-- (frontend/src/data/site-contact.ts): 0123 456 789, an old 0123 prefix that Vietnam retired in 2018.
--
-- Safe to re-run: only rows still holding the old hotline are changed.
-- MySQL Workbench: run SET SQL_SAFE_UPDATES = 0; first, as the WHERE clause does not use a key.
SET NAMES utf8mb4;
START TRANSACTION;

UPDATE branches SET phone = '0123 456 789' WHERE phone = '19006886';

COMMIT;
