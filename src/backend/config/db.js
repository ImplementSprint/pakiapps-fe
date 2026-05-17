const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Sequelize instance — shared across all models.
 * Connects to Supabase PostgreSQL when DATABASE_URL is set.
 */

const dbUrl  = (process.env.DATABASE_URL || '').trim();
const useSSL = dbUrl.length > 0;
const connStr = useSSL
  ? dbUrl
  : `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASS || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'pakipark'}`;

const sequelize = new Sequelize(
  connStr,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => {
          if (sql.includes('Executing')) return;
          console.log('[SQL]', sql);
        }
      : false,
    dialectOptions: useSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
  }
);

// ─── Partial indexes for public schema ──────────────────────────────────────
const PERFORMANCE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_bookings_location_date_active
     ON public.bookings ("locationId", date)
     WHERE status IN ('upcoming', 'active')`,

  `CREATE INDEX IF NOT EXISTS idx_bookings_slot_date_active
     ON public.bookings ("parkingSlotId", date)
     WHERE "parkingSlotId" IS NOT NULL AND status IN ('upcoming', 'active')`,

  `CREATE INDEX IF NOT EXISTS idx_bookings_user_createdat
     ON public.bookings ("userId", "createdAt" DESC)`,

  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_barcode
     ON public.bookings (barcode)
     WHERE barcode IS NOT NULL`,
];

const STARTUP_MIGRATIONS = [
  // ── Ensure table structures match the provided SQL ──────────────────────────
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "supabaseId" UUID`,
  `ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMPTZ`,
  
  // ── operating_hours table (Partner Operating Hours) ──────────────────
  `CREATE TABLE IF NOT EXISTS public.operating_hours (
    id            SERIAL   PRIMARY KEY,
    "locationId"  INTEGER  NOT NULL,
    day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time     TIME,
    close_time    TIME,
    is_closed     BOOLEAN  NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_operating_hours_location
      FOREIGN KEY ("locationId") REFERENCES public.locations(id) ON DELETE CASCADE,
    CONSTRAINT uq_operating_hours_location_day
      UNIQUE ("locationId", day_of_week)
  )`,

  // ── payment_methods extension ───────────────────────────────────────────────
  `ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT false`,

  // ── transaction_logs fallback ───────────────────────────────────────────────
  `DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'enum_bookings_paymentMethod' AND n.nspname = 'public') THEN
        ALTER TYPE public."enum_bookings_paymentMethod" ADD VALUE IF NOT EXISTS 'gcash_linked';
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END $$`,
];

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅  PostgreSQL connected ${useSSL ? '(Supabase/SSL)' : '(local)'}`);

    require('../models/index');

    try {
      // We skip alter:true for major schema conflicts, but it helps with minor column adds
      await sequelize.sync({ alter: false }); 
      console.log('✅  Models loaded');
    } catch (syncErr) {
      console.warn(`⚠️  Schema sync warning: ${syncErr.message.split('\n')[0]}`);
    }

    for (const sql of PERFORMANCE_INDEXES) {
      try { await sequelize.query(sql); } catch (e) { console.warn(`⚠️  Index skipped: ${e.message.split('\n')[0]}`); }
    }
    console.log('✅  Performance indexes verified');

    for (const sql of STARTUP_MIGRATIONS) {
      try { await sequelize.query(sql); } catch (e) { console.warn(`⚠️  Migration skipped: ${e.message.split('\n')[0]}`); }
    }
    console.log('✅  Schema migrations applied');

  } catch (error) {
    console.error(`❌  PostgreSQL Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };