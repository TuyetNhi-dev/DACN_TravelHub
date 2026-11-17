-- 002_email_verification.sql
-- One-time email verification links. Only a SHA-256 hash of each token is stored, so a database leak
-- cannot be used to verify accounts. New sign-ups start as users.status = 'pending' (already in 001)
-- and become 'active' when a valid, unexpired, unused token is consumed.
-- Additive only: creates one table, touches no existing rows.

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL COMMENT 'UTC',
  used_at DATETIME(6) NULL COMMENT 'UTC; set when consumed or superseded by a newer token',
  created_at DATETIME(6) NOT NULL COMMENT 'UTC',
  CONSTRAINT uq_email_verification_token UNIQUE (token_hash),
  CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX ix_email_verification_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
