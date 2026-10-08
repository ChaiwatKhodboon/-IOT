CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE equipment_status AS ENUM ('available', 'maintenance', 'retired');
CREATE TYPE loan_status AS ENUM ('borrowed', 'returned');
CREATE TYPE condition_status AS ENUM ('normal', 'damaged', 'lost', 'abnormal');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(254),
  google_sub VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  student_id VARCHAR(20),
  avatar_data TEXT,
  role user_role NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE equipment (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT,
  image_data TEXT,
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
  maintenance_quantity INTEGER NOT NULL DEFAULT 0 CHECK (maintenance_quantity >= 0 AND maintenance_quantity <= total_quantity),
  status equipment_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  equipment_id BIGINT NOT NULL REFERENCES equipment(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  status loan_status NOT NULL DEFAULT 'borrowed',
  borrow_remark TEXT,
  borrower_name VARCHAR(120),
  return_remark TEXT,
  return_condition condition_status,
  repaired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_search ON equipment (name, code, category);
CREATE INDEX idx_loans_user ON loans (user_id, borrowed_at DESC);
CREATE INDEX idx_loans_status ON loans (status, borrowed_at DESC);
CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_google_sub_unique ON users (google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE password_reset_otps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX password_reset_otps_user_created ON password_reset_otps (user_id, created_at DESC);

-- Readable loan history. Equipment and account details reflect their current
-- values; borrower_name preserves the name supplied when borrowing, if present.
CREATE OR REPLACE VIEW loan_details AS
SELECT
  l.id AS loan_id,
  l.equipment_id,
  e.code AS equipment_code,
  e.name AS equipment_name,
  e.category AS equipment_category,
  l.quantity,
  l.user_id,
  COALESCE(NULLIF(l.borrower_name, ''), u.full_name) AS borrower_name,
  u.username AS borrower_username,
  u.student_id AS borrower_student_id,
  l.borrowed_at,
  l.due_at,
  l.returned_at,
  l.status,
  l.return_condition,
  CASE WHEN l.borrow_remark IS NOT NULL AND l.borrow_remark <> ''
         OR l.return_remark IS NOT NULL AND l.return_remark <> ''
         OR l.return_condition IN ('damaged', 'abnormal', 'lost')
       THEN COALESCE(l.returned_at, l.borrowed_at)
  END AS issue_reported_at,
  l.repaired_at,
  CASE
    WHEN l.repaired_at IS NOT NULL THEN 'completed'
    WHEN l.return_condition IN ('damaged', 'abnormal') THEN 'pending'
    WHEN l.return_condition = 'lost' THEN 'lost'
    ELSE NULL
  END AS repair_status,
  l.borrow_remark,
  l.return_remark,
  (l.status = 'borrowed' AND l.due_at < NOW()) AS is_overdue,
  l.updated_at
FROM loans l
LEFT JOIN equipment e ON e.id = l.equipment_id
LEFT JOIN users u ON u.id = l.user_id;
