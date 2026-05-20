const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ParkingSlot — aligned with parking_lot.parking_slots
 *
 * Each slot has exactly ONE assigned teller (tellerUserId → UUID of the teller
 * in account.profiles / auth.users). This allows slot-level teller assignment
 * so a teller manages their own designated bay(s).
 *
 * locationId is UUID (parking_lot.locations.id).
 * tellerUserId is UUID (auth.users.id of the assigned teller — nullable).
 */
const ParkingSlot = sequelize.define(
  'ParkingSlot',
  {
    id: { 
      type: DataTypes.UUID, 
      primaryKey: true, 
      defaultValue: DataTypes.UUIDV4 
    },

    // ── Location FK (UUID → parking_lot.locations.id) ────────────────────────
    locationId: { 
      type: DataTypes.UUID, 
      allowNull: false,
      field: 'location_id'
    },

    // ── Teller assignment (one teller per slot) ───────────────────────────────
    // UUID of the teller user in auth.users / account.profiles.
    // Nullable: slot is unassigned if null.
    tellerUserId: { 
      type: DataTypes.UUID, 
      allowNull: true, 
      defaultValue: null 
    },

    // ── Slot identity ─────────────────────────────────────────────────────────
    label:   { type: DataTypes.STRING(20), allowNull: false },
    section: { type: DataTypes.STRING(10), allowNull: false },
    floor:   { type: DataTypes.INTEGER,    defaultValue: 1 },

    // ── Classification ────────────────────────────────────────────────────────
    type: {
      type:         DataTypes.STRING(30),
      defaultValue: 'regular',
      // 'regular' | 'handicapped' | 'ev_charging' | 'vip' | 'motorcycle'
    },
    size: {
      type:         DataTypes.STRING(20),
      defaultValue: 'standard',
      allowNull:    false,
      // 'compact' | 'standard' | 'large'
    },
    status: {
      type:         DataTypes.STRING(20),
      defaultValue: 'available',
      // 'available' | 'occupied' | 'reserved' | 'maintenance'
    },
    vehicleTypeAllowed: {
      type:         DataTypes.STRING(20),
      defaultValue: 'any',
      // 'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle' | 'any'
    },
  },
  {
    tableName:  'parking_slots',
    schema:     'parking_lot',     // ← mapped to new schema
    timestamps: true,
    indexes: [
      { name: 'uq_parking_lot_parking_slots_location_label', unique: true,  fields: ['location_id', 'label'] },
      { name: 'idx_parking_lot_slots_location_layout',       fields: ['location_id', 'floor', 'section'] },
      { name: 'idx_parking_lot_slots_location_status',       fields: ['location_id', 'status'] },
      { name: 'idx_parking_lot_slots_location_type',         fields: ['location_id', 'type'] },
      { name: 'idx_parking_lot_slots_teller',                fields: ['tellerUserId'] },
    ],
  }
);

ParkingSlot.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = String(values.id);
  return values;
};

module.exports = ParkingSlot;