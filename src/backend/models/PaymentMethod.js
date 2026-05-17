const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * PaymentMethod — aligned with public.payment_methods (integer IDs, camelCase).
 */
const PaymentMethod = sequelize.define('PaymentMethod', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  provider: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'GCash',
  },
  paymentType: {
    type: DataTypes.ENUM('gcash', 'paymaya', 'card', 'cash'),
    allowNull: false,
  },
  accountName:    { type: DataTypes.STRING, allowNull: true },
  lastFourDigits: { type: DataTypes.STRING, allowNull: true },
  isDefault:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  schema: 'public',
  tableName: 'payment_methods',
  timestamps: true,
  indexes: [
    { name: 'idx_payment_methods_user', fields: ['userId'] },
  ],
});

module.exports = PaymentMethod;
