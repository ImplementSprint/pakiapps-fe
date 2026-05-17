const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkSchema() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
  });

  try {
    const [bookings] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'reservation' AND table_name = 'bookings' ORDER BY ordinal_position");
    console.log('Columns in reservation.bookings:');
    console.log(bookings.map(c => c.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
