-- 003_otp_and_google_sign_in.sql
-- 1) Email verification switches from one-time links to 6-digit OTP codes. A 6-digit code can be guessed,
--    so each code tracks failed attempts and is retired after 5 wrong tries (enforced by the backend).
-- 2) "Continue with Google": users.google_subject stores Google's stable account id ("sub" claim).
--    Accounts created through Google have password_hash = NULL.
-- Additive only: adds two nullable/defaulted columns and one unique key; no existing values change.
-- Run after 002.

ALTER TABLE email_verification_tokens
  ADD COLUMN failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER used_at;

ALTER TABLE users
  ADD COLUMN google_subject VARCHAR(255) NULL AFTER password_hash,
  ADD CONSTRAINT uq_users_google_subject UNIQUE (google_subject);
