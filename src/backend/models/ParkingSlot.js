const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ParkingSlot — aligned with public.parking_slots (integer IDs, camelCase).
 */
const ParkingSlot = sequelize.define(
  'ParkingSlot',
  {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    label:      { type: DataTypes.STRING(20), allowNull: false },
    section:    { type: DataTypes.STRING(10), allowNull: false },
    floor:      { type: DataTypes.INTEGER, defaultValue: 1 },
    type: {
      type: DataTypes.ENUM('regular', 'handicapped', 'ev_charging', 'vip', 'motorcycle'),
      defaultValue: 'regular',
    },
    size: {
      type: DataTypes.ENUM('compact', 'standard', 'large'),
      defaultValue: 'standard',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved', 'maintenance'),
      defaultValue: 'available',
    },
    vehicleTypeAllowed: {
      type: DataTypes.ENUM('sedan', 'suv', 'van', 'truck', 'motorcycle', 'any'),
      defaultValue: 'any',
    },
  },
  {
    tableName: 'parking_slots',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'parking_slots_location_label_unique', unique: true, fields: ['locationId', 'label'] },
      { name: 'idx_parking_slots_location_layout',   fields: ['locationId', 'floor', 'section'] },
      { name: 'idx_parking_slots_location_status',   fields: ['locationId', 'status'] },
      { name: 'idx_parking_slots_location_type',     fields: ['locationId', 'type'] },
    ],
  }
);

ParkingSlot.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = String(values.id);
  return values;
};

module.exports = ParkingSlot;