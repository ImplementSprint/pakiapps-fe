const { User } = require('./src/Backend/models/index');
const { sequelize } = require('./src/Backend/config/db');

async function checkAdmin() {
  try {
    await sequelize.authenticate();
    const admin = await User.findOne({ where: { email: 'admin@pakipark.com' } });
    if (admin) {
      console.log('✅ Admin user found:', admin.email);
    } else {
      console.log('❌ Admin user NOT found');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sequelize.close();
  }
}

checkAdmin();
