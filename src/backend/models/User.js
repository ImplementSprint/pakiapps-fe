const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * User — master profile model.
 * Maps to account.users (domain schema — NOT public).
 * Supabase Auth UUID is stored in supabaseId for cross-schema joins.
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name:      { type: DataTypes.STRING,   allowNull: true },
    firstName: { type: DataTypes.STRING,   allowNull: false, defaultValue: '' },
    lastName:  { type: DataTypes.STRING,   allowNull: false, defaultValue: '' },
    email:     { type: DataTypes.STRING,   allowNull: false, unique: true },
    password:  { type: DataTypes.STRING,   allowNull: false },
    phone:     { type: DataTypes.STRING,   allowNull: true },
    role: {
      type: DataTypes.ENUM('customer', 'business_partner', 'teller', 'admin'),
      defaultValue: 'customer',
    },
    profilePicture: { type: DataTypes.TEXT,     allowNull: true },
    address:        { type: DataTypes.JSONB,    defaultValue: {} },
    dateOfBirth:    { type: DataTypes.DATEONLY, allowNull: true },
    isVerified:     { type: DataTypes.BOOLEAN,  defaultValue: false },

    // Verification / Partner statuses
    discountStatus: {
      type: DataTypes.ENUM('none', 'pending', 'verified', 'rejected'),
      defaultValue: 'none',
    },
    discountPct:    { type: DataTypes.INTEGER, defaultValue: 0 },
    discountIdUrl:  { type: DataTypes.TEXT,    allowNull: true },
    discountType:   { type: DataTypes.STRING,  allowNull: true },

    // Security
    twoFactorSecret:  { type: DataTypes.STRING,  allowNull: true },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Metadata
    documents:      { type: DataTypes.JSONB, defaultValue: {} },
    preferences:    { type: DataTypes.JSONB, defaultValue: { autoExtend: false, smsUpdates: true, emailNotifications: true } },
    gcashNumber:    { type: DataTypes.STRING, allowNull: true },
    paymentMethods: { type: DataTypes.JSONB, defaultValue: [] },

    // PWD / Senior verification
    isVerifiedPWD: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Soft-delete
    deletedAt: { type: DataTypes.DATE, allowNull: true },

    // Auth linking
    supabaseId: { type: DataTypes.UUID, unique: true, allowNull: true },
  },
  {
    tableName: 'users',
    schema:    'account',          // ← account schema (NO public)
    timestamps: true,
    paranoid:   false,             // deletedAt managed manually
  }
);

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  values._id = String(values.id);
  // Virtual: full name for backwards compatibility
  values.name = values.name || `${values.firstName || ''} ${values.lastName || ''}`.trim();
  return values;
};

module.exports = User;