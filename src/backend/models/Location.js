const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Location — parking facility.
 * Aligned with public.locations schema.
 */
const Location = sequelize.define(
  'Location',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name:    { type: DataTypes.STRING,  allowNull: false },
    address: { type: DataTypes.STRING,  allowNull: false },
    lat:     { type: DataTypes.FLOAT,   allowNull: true },
    lng:     { type: DataTypes.FLOAT,   allowNull: true },
    totalSpots:     { type: DataTypes.INTEGER, defaultValue: 100 },
    availableSpots: { type: DataTypes.INTEGER, defaultValue: 100 },
    hourlyRate:     { type: DataTypes.FLOAT,   defaultValue: 50 },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active',
    },
    operatingHours: { type: DataTypes.JSONB, defaultValue: {} },
    amenities:      { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    partnerId:      { type: DataTypes.INTEGER, allowNull: true },
    operatingHoursJson: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    tableName: 'locations',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'idx_locations_status',  fields: ['status'] },
      { name: 'idx_locations_partner', fields: ['partnerId'] },
    ],
  }
);

Location.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = String(v.id);
  return v;
};

module.exports = Location;
