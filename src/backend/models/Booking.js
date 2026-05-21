'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Booking — fully denormalized for zero-JOIN reads.
 * Aligned with reservation.bookings schema (NOT public).
 *
 * NOTE: user_id, location_id, parking_slot_id are UUIDs in the DB.
 *       vehicle_id is INTEGER (teller.vehicles.id).
 *       userId stored as UUID (supabaseId) for cross-schema joins.
 */
const Booking = sequelize.define(
  'Booking',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // ── Soft FK references ────────────────────────────────────────────────────
    userId:        { type: DataTypes.UUID,    allowNull: false, field: 'user_id' },   // account.profiles.id
    vehicleId:     { type: DataTypes.INTEGER, allowNull: false, field: 'vehicle_id' },   // teller.vehicles.id
    locationId:    { type: DataTypes.UUID,    allowNull: false, field: 'location_id' },   // routing.operator_hubs.id
    parkingSlotId: { type: DataTypes.UUID,    allowNull: true,  field: 'parking_slot_id' },    // teller.parking_slots (future)

    // ── Booking identity ──────────────────────────────────────────────────────
    reference: { type: DataTypes.STRING(30), unique: true },
    barcode:   { type: DataTypes.STRING(50), allowNull: true, unique: true },
    spot:      { type: DataTypes.STRING(20), allowNull: false },

    // ── Schedule ──────────────────────────────────────────────────────────────
    date:     { type: DataTypes.DATEONLY,   allowNull: false },
    timeSlot: { type: DataTypes.STRING(20), allowNull: false },
    type:     { type: DataTypes.STRING(50), defaultValue: '1-Hour Slot' },

    // ── Status / payment ──────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'),
      defaultValue: 'Pending',
    },
    amount:      { type: DataTypes.FLOAT, allowNull: false },
    finalAmount: { type: DataTypes.VIRTUAL },
    paymentMethod: {
      type: DataTypes.ENUM('GCash', 'PayMaya', 'Credit/Debit Card', 'gcash_linked'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'pending', 'partial', 'refunded'),
      defaultValue: 'pending',
    },
    paymentSessionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'payment_session_id',
    },

    // ── Teller flags ──────────────────────────────────────────────────────────
    checkedInByTeller: { type: DataTypes.BOOLEAN, defaultValue: false },

    // ── Lifecycle timestamps ──────────────────────────────────────────────────
    checkInAt:      { type: DataTypes.DATE, allowNull: true },
    checkOutAt:     { type: DataTypes.DATE, allowNull: true },
    cancelledAt:    { type: DataTypes.VIRTUAL },
    cancelReason:   { type: DataTypes.VIRTUAL },
    reminderSentAt: { type: DataTypes.VIRTUAL },

    // ── User snapshot (Virtual for backward compatibility) ────────────────────
    userName:  { type: DataTypes.VIRTUAL },
    userEmail: { type: DataTypes.VIRTUAL },
    userPhone: { type: DataTypes.VIRTUAL },

    // ── Vehicle snapshot ──────────────────────────────────────────────────────
    vehicleBrand: { type: DataTypes.VIRTUAL },
    vehicleModel: { type: DataTypes.VIRTUAL },
    vehiclePlate: { type: DataTypes.STRING(20),  allowNull: true },
    vehicleType:  { type: DataTypes.STRING(20),  allowNull: true },
    vehicleColor: { type: DataTypes.STRING(30),  allowNull: true },

    // ── Location snapshot ─────────────────────────────────────────────────────
    locationName:    { type: DataTypes.STRING(200), allowNull: true },
    locationAddress: { type: DataTypes.STRING(400), allowNull: true },
  },
  {
    tableName:  'bookings',
    schema:     'reservation',    // ← reservation schema (NO public)
    timestamps: true,
    indexes: [
      { name: 'res_bookings_reference_unique',    unique: true, fields: ['reference'] },
      { name: 'res_bookings_barcode_unique',      unique: true, fields: ['barcode'] },
    ],
  }
);

// ── Auto-generate reference + barcode on create ──────────────────────────────
Booking.addHook('beforeCreate', async (booking) => {
  const [[row]] = await sequelize.query("SELECT nextval('booking_reference_seq') AS n");
  const padded = String(row.n).padStart(8, '0');
  booking.reference = `PKP-${padded}`;
  booking.barcode   = `PKP${padded}`;
});

Booking.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = String(v.id);
  return v;
};

module.exports = Booking;
