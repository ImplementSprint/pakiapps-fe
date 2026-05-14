'use strict';
/**
 * seed-auth.js — Supabase Auth seed script
 * ==========================================
 * Creates the 4 system credentials in Supabase auth.users AND
 * upserts matching rows in account.users.
 *
 * Run from: src/Backend/
 *   node config/seed-auth.js
 */

const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { sequelize }    = require('./db');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SYSTEM_USERS = [
  {
    email:    'admin@pakipark.com',
    password: 'Admin2026!',
    name:     'Super Admin',
    phone:    '09171234567',
    role:     'admin',
  },
  {
    email:    'partner1@pakipark.com',
    password: 'Partner2026!',
    name:     'Business Partner 1',
    phone:    '09271234567',
    role:     'business_partner',
    notes:    'Owns: SM Megamall Main Parking',
  },
  {
    email:    'partner2@pakipark.com',
    password: 'Partner2026!',
    name:     'Business Partner 2',
    phone:    '09371234567',
    role:     'business_partner',
    notes:    'Owns: Glorietta Parking',
  },
  {
    email:    'teller1@pakipark.com',
    password: 'Teller2026!',
    name:     'Teller 1',
    phone:    '09471234567',
    role:     'teller',
    notes:    'Manages checkout point operations',
  },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅  DB connected\n');

    // Ensure authId column exists before we try to use it
    await sequelize.query(
      `ALTER TABLE account.users ADD COLUMN IF NOT EXISTS "authId" UUID`,
    ).catch(() => null);
    await sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_account_users_auth_id
       ON account.users ("authId") WHERE "authId" IS NOT NULL`,
    ).catch(() => null);

    for (const u of SYSTEM_USERS) {
      console.log(`→  Processing ${u.email} …`);

    // 1. List ALL auth users (paginate up to 1000)
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
      const existing = (listData?.users ?? []).find(
        (au) => au.email?.toLowerCase() === u.email.toLowerCase(),
      );

      let authId;

      if (existing) {
        authId = existing.id;
        // Update password + metadata to match the spec
        const { error: pwErr } = await supabase.auth.admin.updateUserById(authId, {
          password:      u.password,
          email_confirm: true,
          user_metadata: { name: u.name, phone: u.phone, role: u.role },
        });
        if (pwErr) {
          console.warn(`  ⚠️  Could not update: ${pwErr.message}`);
        } else {
          console.log(`  ✔  auth.users updated  (id: ${authId})`);
        }
      } else {
        // Create new auth user
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email:         u.email,
          password:      u.password,
          email_confirm: true,
          user_metadata: { name: u.name, phone: u.phone, role: u.role },
        });
        if (authErr) {
          console.error(`  ❌  Failed to create auth user: ${authErr.message}`);
          continue;
        }
        authId = authData.user.id;
        console.log(`  ✔  auth.users created   (id: ${authId})`);
      }

      // 2. Upsert account.users row linked to this auth identity
      await sequelize.query(
        `INSERT INTO account.users
           ("authId", name, email, phone, role, "isVerified", "createdAt", "updatedAt")
         VALUES
           (:authId, :name, :email, :phone, :role, true, now(), now())
         ON CONFLICT ("authId") DO UPDATE
           SET name  = EXCLUDED.name,
               email = EXCLUDED.email,
               phone = EXCLUDED.phone,
               role  = EXCLUDED.role,
               "isVerified" = true,
               "updatedAt"  = now()`,
        {
          replacements: {
            authId, name: u.name, email: u.email, phone: u.phone, role: u.role,
          },
        },
      );
      console.log(`  ✔  account.users upserted (role: ${u.role})\n`);
    }

    console.log('✅  All system credentials seeded!');
    console.log('\nCredentials:');
    SYSTEM_USERS.forEach((u) =>
      console.log(`  ${u.role.padEnd(18)} ${u.email}  /  ${u.password}  ${u.notes ? `— ${u.notes}` : ''}`),
    );
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed error:', err.message);
    process.exit(1);
  }
}

run();
