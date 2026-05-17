const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * ActivityLog — aligned with public.activity_logs (integer IDs, camelCase).
 * Immutable — append-only, no updates.
 */
const ActivityLog = sequelize.define(
  'ActivityLog',
  {
    id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },

    action: { type: DataTypes.STRING(80), allowNull: false },

    entityType: { type: DataTypes.STRING(50), allowNull: true },
    entityId:   { type: DataTypes.STRING(30), allowNull: true },
    description:{ type: DataTypes.TEXT,       allowNull: true },

    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.TEXT,       allowNull: true },

    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'info',
    },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    tableName: 'activity_logs',
    schema: 'public',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'idx_actlog_user',     fields: ['userId'] },
      { name: 'idx_actlog_action',   fields: ['action'] },
      { name: 'idx_actlog_entity',   fields: ['entityType', 'entityId'] },
      { name: 'idx_actlog_severity', fields: ['severity'] },
    ],
  }
);

ActivityLog.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = String(v.id);
  return v;
};

module.exports = ActivityLog;
