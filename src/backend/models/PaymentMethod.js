'use strict';
/**
 * PaymentMethod.js
 * ================
 * Stores saved payment methods for customers.
 * SCRUM-1014 (GCash Link) / SCRUM-1018 (Auto-Charge)
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PaymentMethod = sequelize.define(
  'PaymentMethod',
  {
    id:            { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
    userId:        { type: DataTypes.INTEGER,     allowNull: false },
    provider:      { type: DataTypes.STRING(30),  allowNull: false, defaultValue: 'GCash' },  // 'GCash' | 'PayMaya' | 'card'
    mobileNumber:  { type: DataTypes.STRING(20),  allowNull: true,  field: 'mobile_number' },  // 09XXXXXXXXX
    displayLabel:  { type: DataTypes.STRING(60),  allowNull: true,  field: 'display_label' },  // "GCash •••• 1234"
    isDefault:     { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false, field: 'is_default' },
  },
  {
    tableName:  'payment_methods',
    schema: 'payment',
    timestamps: true,
    indexes: [
      { name: 'idx_payment_methods_user', fields: ['userId'] },
    ],
  }
);

PaymentMethod.prototype.toJSON = function () {
  const v    = Object.assign({}, this.get());
  v._id      = String(v.id);
  return v;
};

module.exports = PaymentMethod;
