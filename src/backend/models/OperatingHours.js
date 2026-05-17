const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * OperatingHours — aligned with public.operating_hours (integer FK, snake_case cols).
 */
const OperatingHours = sequelize.define('OperatingHours', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  day_of_week: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: { min: 0, max: 6 },
  },
  open_time:  { type: DataTypes.TIME,    allowNull: true },
  close_time: { type: DataTypes.TIME,    allowNull: true },
  is_closed:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  schema: 'public',
  tableName: 'operating_hours',
  timestamps: true,
  indexes: [
    { name: 'uq_operating_hours_location_day', unique: true, fields: ['locationId', 'day_of_week'] },
  ],
});

module.exports = OperatingHours;
