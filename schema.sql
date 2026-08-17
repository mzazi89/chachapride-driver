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

-- Contact messages from the public contact form
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paystack payments + cash commission
ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS commission NUMERIC(10, 2);

-- Cash ride commissions the driver must deposit to the owner's account
CREATE TABLE IF NOT EXISTS cash_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deposited_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_settlements_driver ON cash_settlements (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_status ON cash_settlements (status);

-- Driver live location (used to find nearby drivers / nearby ride requests)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Rides a driver declined — they are hidden from that driver's ring notifications
CREATE TABLE IF NOT EXISTS ride_declines (
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (driver_id, ride_id)
);

CREATE INDEX IF NOT EXISTS idx_ride_declines_ride ON ride_declines (ride_id);

-- Ride types (owner-managed; seeded from lib defaults, idempotent)
CREATE TABLE IF NOT EXISTS ride_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🚗',
  base_price NUMERIC(10, 2) NOT NULL,
  per_km NUMERIC(10, 2) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ride_types (id, name, icon, base_price, per_km, capacity, description, active) VALUES
  ('motorbike',     'Motorbike',     '🏍️', 50, 30, 1, 'Fastest way through traffic', TRUE),
  ('electric_bike', 'Electric Bike', '⚡', 50, 25, 1, 'Eco-friendly — 5 KSh less per km', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, icon = EXCLUDED.icon, base_price = EXCLUDED.base_price,
  per_km = EXCLUDED.per_km, capacity = EXCLUDED.capacity, description = EXCLUDED.description;

DELETE FROM ride_types WHERE id IN ('uberx', 'uberxl', 'comfort', 'green');
