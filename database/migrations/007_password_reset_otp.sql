ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(254);

UPDATE users
SET email = LOWER(username)
WHERE email IS NULL
  AND username ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (LOWER(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_otps_user_created
  ON password_reset_otps (user_id, created_at DESC);
