# chachapride Driver App

Driver-facing web app for the chachapride ride-hailing platform — drivers sign up with their vehicle details, get approved by the owner, go online, and accept ride requests.

Built with Next.js 14 (App Router), React 18, Tailwind CSS, Leaflet maps, and a Neon Postgres database.

## Features

- 🔐 Driver signup with license + vehicle details (stored in a transaction)
- ⏳ Approval flow: new drivers start unapproved; the owner must approve them before they can work
- 🟢 Go online / offline availability toggle
- 🚕 Live ride request queue (polled), one-tap Accept
- 🗺️ Active trip screen with pickup → destination map (Leaflet + OSRM route)
- 📍 GPS reporting: location is posted to the server every 3 seconds during a trip
- 💰 Earnings dashboard: total trips, total earnings, today's earnings, trip history

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Neon Postgres database and copy its connection string.

3. Configure environment:

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
JWT_SECRET="<generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
```

> `.env.local` is gitignored — never commit real credentials.

4. Create the tables and seed demo accounts:

```bash
node --env-file=.env.local scripts/setup-db.mjs
node --env-file=.env.local scripts/seed.mjs
```

5. Run:

```bash
npm run dev
```

Open http://localhost:3000

## Demo driver

| Field    | Value                        |
| -------- | ---------------------------- |
| Email    | `driver@chachapride.com`     |
| Password | `password123`                |
| Role     | driver (already **approved**) |

Other seeded accounts (password123): `owner@chachapride.com` (owner dashboard) and `demo@chachapride.com` (rider app).

## Driver signup flow

1. Drivers sign up on the driver site (`/signup`) with name, email, password, license number, vehicle model, and plate number.
2. A `drivers` profile row is created with `approved = false`.
3. The owner must approve the driver in the owner dashboard. The server enforces this — all `/api/driver/*` endpoints return `403` for unapproved drivers.
4. Once approved, the driver can go online (`/api/driver/availability`), see the ride request queue, accept rides, and track trips.

## Pages

- `/` — work screen: approval status, availability toggle, ride request queue, active trip with map + GPS reporting
- `/history` — earnings summary and completed trips
- `/signup` — driver account creation
- `/login` — shared login (posts `{email, password}` to `/api/auth/login`)

## API

| Method | Route                       | Auth   | Description                              |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| POST   | /api/auth/signup            | No     | Create account (role `driver` + driverInfo in a transaction) |
| POST   | /api/auth/login             | No     | Log in, sets session cookie              |
| POST   | /api/auth/logout            | No     | Clears session cookie                    |
| GET    | /api/auth/me                | Yes    | Current user (includes `driver` for drivers) |
| GET    | /api/driver/me              | Driver | Driver profile: license, vehicle, status, approved |
| GET    | /api/driver/rides?status=requested | Driver | Ride request queue (unassigned rides) |
| GET    | /api/driver/rides/mine      | Driver | Driver's active trip (accepted / en_route) or null |
| POST   | /api/driver/rides/:id/accept | Driver | Accept a ride (409 if no longer available) |
| POST   | /api/driver/rides/:id/status | Driver | Advance trip: `en_route`, `completed`    |
| POST   | /api/driver/availability    | Driver | Set status `available` / `offline`       |
| POST   | /api/driver/location        | Driver | Report live GPS `{lat, lng}` during a trip |
| GET    | /api/driver/history         | Driver | Completed trips + earnings summary       |

## Notes

- Map tiles, geocoding, and routing use free public services (OSM, Nominatim, OSRM); for production traffic, switch to a commercial provider or self-hosted tiles.
- Ride prices are estimated from straight-line distance (haversine) + a per-type rate.
