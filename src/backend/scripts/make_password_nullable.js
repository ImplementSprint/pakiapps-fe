/**
 * make_password_nullable.js
 * Makes account.users.password nullable since Supabase Auth now owns credentials.
 * Safe to run multiple times.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../config/db');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅  Connected to DB');

    // Drop NOT NULL constraint on password column (it's a CHECK NOT NULL in Supabase)
    await sequelize.query(`
      ALTER TABLE account.users ALTER COLUMN password DROP NOT NULL;
    `);
    console.log('✅  password column is now nullable');

  } catch (err) {
    if (err.message.includes('does not exist') || err.message.includes('already nullable')) {
      console.log('ℹ️   password column is already nullable — skipping');
    } else {
      console.error('❌  Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
