const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * User — master profile model.
 * Connects directly to the public.users table.
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name:     { type: DataTypes.STRING,  allowNull: false },
    email:    { type: DataTypes.STRING,  allowNull: false, unique: true },
    password: { type: DataTypes.STRING,  allowNull: false },
    phone:    { type: DataTypes.STRING,  allowNull: true },
    role: {
      type: DataTypes.ENUM('customer', 'business_partner', 'teller', 'admin'),
      defaultValue: 'customer',
    },
    profilePicture: { type: DataTypes.TEXT,    allowNull: true },
    address:        { type: DataTypes.JSONB,   defaultValue: {} },
    dateOfBirth:    { type: DataTypes.DATEONLY, allowNull: true },
    isVerified:     { type: DataTypes.BOOLEAN, defaultValue: false },

    // Verification / Partner statuses
    discountStatus: {
      type: DataTypes.ENUM('none', 'pending', 'verified', 'rejected'),
      defaultValue: 'none',
    },
    discountPct: { type: DataTypes.INTEGER, defaultValue: 0 },
    discountIdUrl: { type: DataTypes.TEXT, allowNull: true },
    discountType:  { type: DataTypes.STRING, allowNull: true },

    // Security
    twoFactorSecret:  { type: DataTypes.STRING,  allowNull: true },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Metadata
    documents:      { type: DataTypes.JSONB, defaultValue: {} },
    preferences:    { type: DataTypes.JSONB, defaultValue: { autoExtend: false, smsUpdates: true, emailNotifications: true } },
    paymentMethods: { type: DataTypes.JSONB, defaultValue: [] },
    
    // Auth linking
    supabaseId: { type: DataTypes.UUID, unique: true, allowNull: true },
  },
  {
    tableName: 'users',
    schema: 'public',
    timestamps: true,
  }
);

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  values._id = String(values.id);
  return values;
};

module.exports = User;