const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Location — maps to parking_lot.locations (the canonical establishment table).
 *
 * Schema: parking_lot
 * Primary key: UUID (id)
 * Owner link: partner_user_id UUID → account.users.supabaseId
 *
 * This replaces the old public.locations and routing.operator_hubs mappings.
 */
const Location = sequelize.define(
  'Location',
  {
    id: {
      type:       DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    // FK to account.users.supabaseId — identifies the Business Partner owner
    partner_user_id: { type: DataTypes.UUID, allowNull: true },
    name:          { type: DataTypes.STRING, allowNull: false },
    address:       { type: DataTypes.STRING, allowNull: false },
    lat:           { type: DataTypes.FLOAT,  allowNull: true },
    lng:           { type: DataTypes.FLOAT,  allowNull: true },
    amenities:     { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    totalSpots:    { type: DataTypes.INTEGER, defaultValue: 0 },
    availableSpots:{ type: DataTypes.INTEGER, defaultValue: 0 },
    hourlyRate:    { type: DataTypes.FLOAT, defaultValue: 0 }, // still denormalized here for easy reads, but also managed in parking_rates
    status:        { type: DataTypes.STRING, defaultValue: 'active' },
    operatingHours:{ type: DataTypes.JSONB, allowNull: true },
    operatingHoursJson:{ type: DataTypes.JSONB, allowNull: true },
    createdAt:     { type: DataTypes.DATE, allowNull: true },
    updatedAt:     { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName:  'locations',
    schema:     'parking_lot',
    timestamps: true,
  }
);

Location.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id      = String(v.id);
  v.hourlyRate    = v.hourlyRate    ?? 0;
  v.availableSpots = v.availableSpots ?? v.totalSpots;
  return v;
};

module.exports = Location;
