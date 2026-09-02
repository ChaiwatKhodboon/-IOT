CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE equipment_status AS ENUM ('available', 'maintenance', 'retired');
CREATE TYPE loan_status AS ENUM ('borrowed', 'returned');
CREATE TYPE condition_status AS ENUM ('normal', 'damaged', 'lost', 'abnormal');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
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
  return_remark TEXT,
  return_condition condition_status,
  repaired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_search ON equipment (name, code, category);
CREATE INDEX idx_loans_user ON loans (user_id, borrowed_at DESC);
CREATE INDEX idx_loans_status ON loans (status, borrowed_at DESC);
