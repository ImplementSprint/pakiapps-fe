const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Vehicle — aligned with teller.vehicles (NOT public).
 * Managed by tellers; userId is an integer FK to account.users.id.
 */
const Vehicle = sequelize.define(
  'Vehicle',
  {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId:      { type: DataTypes.INTEGER, allowNull: false },
    brand:       { type: DataTypes.STRING,  allowNull: false },
    model:       { type: DataTypes.STRING,  allowNull: false },
    color:       { type: DataTypes.STRING,  allowNull: false },
    plateNumber: { type: DataTypes.STRING,  allowNull: false },
    type: {
      type: DataTypes.ENUM('sedan', 'suv', 'van', 'truck', 'motorcycle', 'hatchback', 'pickup'),
      defaultValue: 'sedan',
    },
    orDoc:     { type: DataTypes.TEXT,    defaultValue: null },
    crDoc:     { type: DataTypes.TEXT,    defaultValue: null },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName:  'vehicles',
    schema:     'teller',          // ← teller schema (NO public)
    timestamps: true,
    indexes: [
      { name: 'idx_teller_vehicles_user',  fields: ['userId'] },
      { name: 'idx_teller_vehicles_plate', fields: ['plateNumber'] },
    ],
  }
);

Vehicle.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = String(values.id);
  return values;
};

module.exports = Vehicle;
