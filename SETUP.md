# PakiPark — Local Setup Guide

> **Stack:** React + Vite (frontend) · Express + Sequelize (backend) · PostgreSQL (Supabase or local)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18 or higher |
| npm | v9 or higher |
| PostgreSQL | v14+ (local) **or** a free [Supabase](https://supabase.com) project |

---

## Quick Start (Recommended)

```bash
# 1. Install all dependencies (frontend + backend in one command)
npm run install:all

# 2. Configure the backend (see step 2 below)
# Edit src/backend/.env

# 3. Sync the database schema
npm run db:sync

# 4. Seed initial data  ⚠️  deletes existing users/locations
npm run db:seed

# 5. Run both frontend and backend together
npm run dev:all
```

The app will be available at **http://localhost:5173**

---

## Step 1 · Database Options

### Option A — Local PostgreSQL

Make sure PostgreSQL is running locally. The default connection is:
```
postgres://postgres:postgres@localhost:5432/pakipark
```

Create the database first if it doesn't exist:
```sql
CREATE DATABASE pakipark;
```

In `src/backend/.env`, leave `DATABASE_URL` **empty** (the app falls back to local automatically):
```env
DATABASE_URL=
```

### Option B — Supabase (Cloud)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Navigate to **Project Settings → Database → Connection string (URI)**
3. Copy the **Session mode** connection string (port `5432`):
   ```
   postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
4. Paste it as `DATABASE_URL` in `src/backend/.env`

> **Important:** Do NOT apply `src/backend/database/schema.sql` to Supabase.
> Sequelize manages the schema automatically on server start.

---

## Step 2 · Backend Environment

Edit `src/backend/.env` (the file already exists with safe defaults):

```env
# ── Database — pick ONE ───────────────────────────────────────────────────────
# Supabase:
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Local PostgreSQL (leave DATABASE_URL blank):
# DATABASE_URL=

# ── Required ──────────────────────────────────────────────────────────────────
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
ADMIN_ACCESS_CODE=PAKIPARK_ADMIN_2026

# ── Optional ──────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Email (leave blank to skip email sending) ─────────────────────────────────
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your@gmail.com
# SMTP_PASS=your_gmail_app_password
```

---

## Step 3 · Frontend Environment

The file `/.env` already exists at the project root with the correct default:

```env
VITE_API_URL=http://localhost:5000/api
```

No changes needed unless you change the backend port.

---

## Step 4 · Database Sync & Seed

Run these from the **project root** (not from `src/backend`):

```bash
# Sync schema: creates all tables, indexes, booking_reference_seq, and SQL views
npm run db:sync

# Seed initial data (⚠️ deletes existing users, locations, slots, rates)
npm run db:seed
```

Or from inside `src/backend/`:
```bash
cd src/backend
npm run db:sync
npm run seed
```

Expected sync output:
```
✅  PostgreSQL connected (local)
✅  All tables synced (alter — no data lost)
✅  booking_reference_seq — atomic sequence for PKP-XXXXXXXX reference numbers
✅  VIEW v_location_occupancy_today
✅  VIEW v_slot_status_today
🎉  Schema sync complete!
```

Seed creates:
- **Admin user:** `admin@pakipark.com` / `Admin@123`
- **5 locations:** Ayala Center, Robinsons Galleria, SM North EDSA, SM San Lazaro, SM Mall of Asia
- Parking slots for each location (multi-floor, sections A–F)
- Parking rates for Sedan, SUV, Motorcycle, Van, Truck

---

## Step 5 · Running the App

### Option A — Single command (recommended)

```bash
npm run dev:all
```

This starts both servers simultaneously with colour-coded output (FRONT = cyan, BACK = yellow).

### Option B — Two separate terminals

**Terminal 1 — Backend**
```bash
cd src/backend
npm run dev        # nodemon hot-reload on port 5000
```

**Terminal 2 — Frontend**
```bash
# From project root
npm run dev        # Vite dev server on port 5173
```

The frontend runs at **http://localhost:5173**  
The API runs at **http://localhost:5000/api**  
Vite automatically proxies all `/api` calls to port 5000 — no CORS issues.

---

## Step 6 · First Login

### As Admin

| Field | Value |
|-------|-------|
| Role | Business Partner (Admin) |
| Email | `admin@pakipark.com` |
| Password | `Admin@123` |

Or register a new admin via the Sign Up page using access code:
```
PAKIPARK_ADMIN_2026
```

### As Customer

Register a new account via the Sign Up page — no access code needed.

---

## All Available Scripts

### Project root

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend only (port 5173) |
| `npm run dev:backend` | Start Express backend only (port 5000) |
| `npm run dev:all` | **Start both frontend + backend** (recommended) |
| `npm run build` | Production build of the frontend |
| `npm run preview` | Preview the production build |
| `npm run install:all` | Install root + backend dependencies |
| `npm run db:sync` | Sync database schema (safe, no data loss) |
| `npm run db:seed` | Seed initial data (⚠️ deletes seed records) |

### Backend (`cd src/backend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot-reload) |
| `npm start` | Start without hot-reload |
| `npm run db:sync` | Sync schema (alter mode — no data loss) |
| `npm run db:sync:force` | **Drop & recreate all tables** — dev only! |
| `npm run db:indexes` | Re-apply indexes only (skip table sync) |
| `npm run seed` | Seed initial data — **deletes existing seed records** |

---

## Architecture Overview

```
/
├── .env                            # Frontend env (VITE_API_URL)
├── package.json                    # Root scripts incl. dev:all
├── vite.config.ts                  # Vite + /api proxy to :5000
│
└── src/
    ├── app/                        # React frontend (Vite + React Router)
    │   ├── pages/                  # Route-level page components
    │   ├── components/             # Reusable UI + customer + figma
    │   ├── services/               # 10 typed API service files
    │   └── routes.tsx              # React Router config
    │
    └── backend/                    # Express API server
        ├── .env                    # Backend env (DATABASE_URL, JWT_SECRET…)
        ├── .env.example            # Template — copy to .env
        ├── config/
        │   ├── db.js               # Sequelize instance + connectDB()
        │   ├── cors.js             # CORS (localhost:5173 in dev)
        │   └── seed.js             # Database seeder
        ├── controllers/            # 10 route handlers
        ├── middleware/             # auth · adminAuth · validate
        ├── models/                 # 10 Sequelize models + associations
        │   ├── User · Location · Vehicle · ParkingSlot · Booking
        │   ├── Review · Settings · ParkingRate
        │   ├── TransactionLog      # Immutable payment ledger
        │   └── ActivityLog         # Immutable audit trail
        ├── routes/                 # 10 Express routers
        ├── scripts/
        │   └── syncSchema.js       # Full schema sync + index report
        ├── services/               # authService · bookingService · emailService · logService
        ├── utils/
        │   ├── timeUtils.js        # 6-state time-window engine
        │   └── formatters.js       # Sequelize → frontend shape helpers
        └── server.js               # Express app entry point
```

---

## Environment Variables Reference

### Backend (`src/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ for Supabase | Supabase PostgreSQL URI. Leave blank for local. |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens (min 32 chars) |
| `ADMIN_ACCESS_CODE` | ✅ | `PAKIPARK_ADMIN_2026` |
| `PORT` | optional | API port (default: `5000`) |
| `NODE_ENV` | optional | `development` or `production` |
| `CLIENT_URL` | optional | Frontend origin for CORS (default: `http://localhost:5173`) |
| `DB_HOST/PORT/NAME/USER/PASS` | optional | Individual DB params when `DATABASE_URL` is blank |
| `JWT_EXPIRES_IN` | optional | Token expiry (default: `7d`) |
| `SMTP_HOST/PORT/USER/PASS` | optional | Email sending — all optional, skipped if blank |

### Frontend (`/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | optional | Backend base URL (default: `http://localhost:5000/api`) |

---

## Booking Flow

1. Customer logs in → selects a location → chooses a 1-hour time slot
2. Available physical parking slots shown in real-time (time-window aware)
3. Customer picks a slot → pays via **GCash, PayMaya, or Credit/Debit Card**
4. Booking created with reference `PKP-00000001` and barcode `PKP00000001`
5. Transaction + Activity logs written automatically
6. Admin sees real-time slot status in the Smart Parking Dashboard
7. Admin can check-in (`upcoming → active`), check-out (`active → completed`), or mark no-show

### Booking States

| State | Description |
|-------|-------------|
| `upcoming` | Reserved, customer has not arrived yet |
| `arriving_soon` | Start time within 60 minutes |
| `in_grace_period` | Past start time, within 30-minute grace window |
| `no_show` | Past grace period — slot logically freed |
| `active` | Admin checked in the customer |
| `overstay` | Active booking past its end time |
| `completed` | Admin checked out the customer |
| `cancelled` | Cancelled by customer or admin |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot reach the PakiPark API server` | Make sure backend is running: `npm run dev:backend` |
| `PostgreSQL Error: connection refused` | Check `DATABASE_URL` in `src/backend/.env` or ensure local Postgres is running |
| `relation "pakipark" does not exist` | Run `CREATE DATABASE pakipark;` in psql then `npm run db:sync` |
| `Invalid admin access code` | Use `PAKIPARK_ADMIN_2026` exactly |
| `Enum already exists` error during sync | Run `cd src/backend && npm run db:sync:force` (⚠️ drops all data) |
| `booking_reference_seq does not exist` | Run `npm run db:sync` to create the sequence |
| `Cannot create booking — slot conflict` | The slot is already taken for that time window |
| Backend starts but all API calls return 401 | JWT token expired — log out and log back in |
| Port 5000 already in use | Change `PORT=5001` in `src/backend/.env` and `VITE_API_URL=http://localhost:5001/api` in `/.env` |
| Port 5173 already in use | Vite will auto-use the next available port (5174, 5175…) |
