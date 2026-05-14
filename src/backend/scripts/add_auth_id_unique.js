/**
 * add_auth_id_unique_constraint.js
 * Adds a unique constraint on account.users."authId" so that
 * the ON CONFLICT ("authId") upsert in authService.js works correctly.
 * Safe to run multiple times (uses IF NOT EXISTS via PL/pgSQL).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../config/db');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅  Connected to DB');

    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM   information_schema.table_constraints tc
          JOIN   information_schema.constraint_column_usage ccu
                 ON tc.constraint_name = ccu.constraint_name
                 AND tc.table_schema   = ccu.table_schema
          WHERE  tc.table_schema    = 'account'
            AND  tc.table_name      = 'users'
            AND  tc.constraint_type = 'UNIQUE'
            AND  ccu.column_name    = 'authId'
        ) THEN
          ALTER TABLE account.users
            ADD CONSTRAINT users_auth_id_unique UNIQUE ("authId");
          RAISE NOTICE 'Unique constraint on authId added.';
        ELSE
          RAISE NOTICE 'Unique constraint on authId already exists — skipping.';
        END IF;
      END
      $$;
    `);

    console.log('✅  Migration complete: unique constraint on account.users."authId" ensured.');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
