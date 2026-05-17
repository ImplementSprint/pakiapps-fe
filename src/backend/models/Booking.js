'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Booking — fully denormalized for zero-JOIN reads.
 * Aligned with public.bookings schema (integer IDs, camelCase columns).
 */
const Booking = sequelize.define(
  'Booking',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // ── Soft FK references (integer IDs) ──────────────────────────────────────
    userId:        { type: DataTypes.INTEGER, allowNull: false },
    vehicleId:     { type: DataTypes.INTEGER, allowNull: false },
    locationId:    { type: DataTypes.INTEGER, allowNull: false },
    parkingSlotId: { type: DataTypes.INTEGER, allowNull: true },

    // ── Booking identity ───────────────────────────────────────────────────────
    reference: { type: DataTypes.STRING(30), unique: true },
    barcode:   { type: DataTypes.STRING(50), allowNull: true, unique: true },
    spot:      { type: DataTypes.STRING(20), allowNull: false },

    // ── Schedule ───────────────────────────────────────────────────────────────
    date:     { type: DataTypes.DATEONLY,   allowNull: false },
    timeSlot: { type: DataTypes.STRING(20), allowNull: false },
    type:     { type: DataTypes.STRING(50), defaultValue: '1-Hour Slot' },

    // ── Status / payment ───────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
      defaultValue: 'upcoming',
    },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM('GCash', 'PayMaya', 'Credit/Debit Card', 'gcash_linked'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'pending', 'partial', 'refunded'),
      defaultValue: 'pending',
    },

    // ── Lifecycle timestamps ───────────────────────────────────────────────────
    checkInAt:      { type: DataTypes.DATE, allowNull: true },
    checkOutAt:     { type: DataTypes.DATE, allowNull: true },
    cancelledAt:    { type: DataTypes.DATE, allowNull: true },
    cancelReason:   { type: DataTypes.TEXT, allowNull: true },
    finalAmount:    { type: DataTypes.FLOAT, allowNull: true },
    reminderSentAt: { type: DataTypes.DATE, allowNull: true },

    // ── User snapshot ──────────────────────────────────────────────────────────
    userName:  { type: DataTypes.STRING(120), allowNull: true },
    userEmail: { type: DataTypes.STRING(200), allowNull: true },
    userPhone: { type: DataTypes.STRING(30),  allowNull: true },

    // ── Vehicle snapshot ───────────────────────────────────────────────────────
    vehicleBrand: { type: DataTypes.STRING(60),  allowNull: true },
    vehicleModel: { type: DataTypes.STRING(60),  allowNull: true },
    vehiclePlate: { type: DataTypes.STRING(20),  allowNull: true },
    vehicleType:  { type: DataTypes.STRING(20),  allowNull: true },
    vehicleColor: { type: DataTypes.STRING(30),  allowNull: true },

    // ── Location snapshot ──────────────────────────────────────────────────────
    locationName:    { type: DataTypes.STRING(200), allowNull: true },
    locationAddress: { type: DataTypes.STRING(400), allowNull: true },
  },
  {
    tableName: 'bookings',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'bookings_reference_unique',       unique: true, fields: ['reference'] },
      { name: 'bookings_barcode_unique',         unique: true, fields: ['barcode'] },
      { name: 'idx_bookings_location_date',      fields: ['locationId', 'date', 'status'] },
      { name: 'idx_bookings_slot_date',          fields: ['parkingSlotId', 'date', 'status'] },
      { name: 'idx_bookings_user_createdat',     fields: ['userId', 'createdAt'] },
      { name: 'idx_bookings_user_status',        fields: ['userId', 'status'] },
      { name: 'idx_bookings_date',               fields: ['date'] },
      { name: 'idx_bookings_status',             fields: ['status'] },
      { name: 'idx_bookings_location_status',    fields: ['locationId', 'status'] },
      { name: 'idx_bookings_vehicle_type',       fields: ['vehicleType'] },
    ],
  }
);

// ── Auto-generate reference + barcode on create ─────────────────────────────
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
