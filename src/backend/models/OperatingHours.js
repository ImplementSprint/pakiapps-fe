'use strict';
/**
 * OperatingHours.js
 * =================
 * Stores the open/close schedule for each parking location — one row
 * per location per day of the week (0=Sun … 6=Sat).
 * Partner Operating Hours story.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OperatingHours = sequelize.define(
  'OperatingHours',
  {
    id:          { type: DataTypes.INTEGER,  primaryKey: true, autoIncrement: true },
    locationId:  { type: DataTypes.INTEGER,  allowNull: false },
    dayOfWeek:   { type: DataTypes.SMALLINT, allowNull: false, field: 'day_of_week' },  // 0=Sun, 1=Mon … 6=Sat
    openTime:    { type: DataTypes.TIME,     allowNull: true,  field: 'open_time'  },   // null when is_closed
    closeTime:   { type: DataTypes.TIME,     allowNull: true,  field: 'close_time' },
    isClosed:    { type: DataTypes.BOOLEAN,  allowNull: false, defaultValue: false, field: 'is_closed' },
  },
  {
    tableName:  'operating_hours',
    schema: 'parking_lot',
    timestamps: true,
    indexes: [
      { name: 'idx_operating_hours_location', fields: ['locationId'] },
      { name: 'uq_operating_hours_location_day', unique: true, fields: ['locationId', 'day_of_week'] },
    ],
  }
);

OperatingHours.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id   = String(v.id);
  return v;
};

module.exports = OperatingHours;
