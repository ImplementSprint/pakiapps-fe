const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * TransactionLog — aligned with public.transaction_logs (integer IDs, camelCase).
 * Immutable — append-only, no updates.
 */
const TransactionLog = sequelize.define(
  'TransactionLog',
  {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: true },
    userId:    { type: DataTypes.INTEGER, allowNull: true },
    reference: { type: DataTypes.STRING(30), allowNull: true },

    transactionType: {
      type: DataTypes.ENUM('payment', 'refund', 'partial_refund', 'reversal', 'adjustment'),
      allowNull: false,
      defaultValue: 'payment',
    },
    paymentMethod: {
      type: DataTypes.ENUM('GCash', 'PayMaya', 'Credit/Debit Card', 'Cash', 'System'),
      allowNull: false,
    },
    amount:   { type: DataTypes.FLOAT,     allowNull: false },
    currency: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'PHP' },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'pending', 'refunded'),
      allowNull: false,
      defaultValue: 'success',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata:    { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    tableName: 'transaction_logs',
    schema: 'public',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'idx_txlogs_booking',   fields: ['bookingId'] },
      { name: 'idx_txlogs_user',      fields: ['userId'] },
      { name: 'idx_txlogs_reference', fields: ['reference'] },
      { name: 'idx_txlogs_type',      fields: ['transactionType'] },
      { name: 'idx_txlogs_status',    fields: ['status'] },
    ],
  }
);

TransactionLog.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = String(v.id);
  return v;
};

module.exports = TransactionLog;
