-- chachapride schema v2 (idempotent; safe to run repeatedly)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rider',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'rider';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  ride_type TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  driver_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_lat DOUBLE PRECISION;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_lng DOUBLE PRECISION;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_updated_at TIMESTAMPTZ;
ALTER TABLE rides ALTER COLUMN status SET DEFAULT 'requested';

CREATE INDEX IF NOT EXISTS idx_rides_user_created ON rides (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status_created ON rides (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_driver_created ON rides (driver_id, created_at DESC);
