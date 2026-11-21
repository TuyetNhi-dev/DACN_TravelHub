-- 014_terms_consent_and_password_reset.sql
-- Run AFTER 013. Additive only: one nullable column, one defaulted column, one index; no existing value changes.
--
-- 1) users.terms_accepted_at: when the user actively ticked "Tôi đồng ý với Chính sách bảo vệ dữ liệu cá nhân và
--    Thỏa thuận sử dụng" (UTC). Sign-ups with a password set it at registration. Accounts without it (created
--    before this migration, or first signed in with Google) see a "Hoàn tất đăng ký" screen and the API refuses
--    every signed-in feature (403, code "terms_required") until they agree. No consent is assumed for old rows.
--
-- 2) email_verification_tokens.purpose: the same 6-digit OTP table now serves two flows. A code only works for the
--    purpose it was issued for, so a password-reset code can never activate an account and vice versa, and each
--    flow retires only its own older codes. Existing rows are email-verification codes (the default).

ALTER TABLE users
  ADD COLUMN terms_accepted_at DATETIME(6) NULL COMMENT 'UTC; NULL = has not agreed yet' AFTER status;

ALTER TABLE email_verification_tokens
  ADD COLUMN purpose ENUM('verify_email', 'reset_password') NOT NULL DEFAULT 'verify_email' AFTER user_id,
  ADD INDEX ix_email_tokens_user_purpose_created (user_id, purpose, created_at);
