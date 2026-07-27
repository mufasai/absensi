-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'employee',
  initials VARCHAR(5),
  employee_code VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Work Settings
CREATE TABLE IF NOT EXISTS work_settings (
  id INT PRIMARY KEY DEFAULT 1,
  jam_masuk TIME DEFAULT '09:00',
  toleransi INT DEFAULT 15,
  jam_pulang TIME DEFAULT '17:30',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Work Settings if not exists
INSERT INTO work_settings (id, jam_masuk, toleransi, jam_pulang)
VALUES (1, '09:00', 15, '17:30')
ON CONFLICT (id) DO NOTHING;

-- Table Absensi
CREATE TABLE IF NOT EXISTS absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(100),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(100) NOT NULL,
  duration VARCHAR(30),
  location TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  keterangan TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  approval_status VARCHAR(20) DEFAULT 'approved',
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
