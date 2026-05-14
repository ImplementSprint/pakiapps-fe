'use strict';
/**
 * operatingHoursController.js
 * ===========================
 * Partner Operating Hours story.
 *
 * Routes:
 *   GET  /api/operating-hours/:locationId  — public: get 7-day schedule
 *   PUT  /api/operating-hours/:locationId  — partner/admin: upsert full schedule
 */

const { OperatingHours, Location } = require('../models/index');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── GET /api/operating-hours/:locationId ─────────────────────────────────────
const getOperatingHours = async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const rows = await OperatingHours.findAll({
      where: { locationId },
      order: [['day_of_week', 'ASC']],
    });

    // Return a clean 7-element array always, even if DB rows are missing
    const schedule = Array.from({ length: 7 }, (_, day) => {
      const row = rows.find((r) => r.dayOfWeek === day);
      return {
        dayOfWeek: day,
        dayName:   DAY_NAMES[day],
        openTime:  row?.openTime  ?? '06:00',
        closeTime: row?.closeTime ?? '23:00',
        isClosed:  row?.isClosed  ?? false,
      };
    });

    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/operating-hours/:locationId ─────────────────────────────────────
// Body: { schedule: [{ dayOfWeek: 0, openTime: "06:00", closeTime: "22:00", isClosed: false }, …] }
const upsertOperatingHours = async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);

    // Only business_partner owning this location, or admin, may update
    if (req.user.role === 'business_partner') {
      const location = await Location.findByPk(locationId, { attributes: ['ownerId'] });
      if (!location || location.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You do not own this location' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Partner or admin access required' });
    }

    const { schedule } = req.body;
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ success: false, message: 'schedule array is required' });
    }

    // Upsert each day — PostgreSQL ON CONFLICT handled via findOrCreate + update
    const results = await Promise.all(
      schedule.map(async ({ dayOfWeek, openTime, closeTime, isClosed }) => {
        if (dayOfWeek < 0 || dayOfWeek > 6) return null;

        const [row] = await OperatingHours.findOrCreate({
          where:    { locationId, day_of_week: dayOfWeek },
          defaults: { openTime, closeTime, isClosed: isClosed ?? false },
        });

        // Always update to the submitted values
        await row.update({
          openTime:  isClosed ? null : (openTime  ?? row.openTime),
          closeTime: isClosed ? null : (closeTime ?? row.closeTime),
          isClosed:  isClosed ?? false,
        });

        return row.toJSON();
      })
    );

    res.json({
      success: true,
      message: 'Operating hours updated',
      data:    results.filter(Boolean),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getOperatingHours, upsertOperatingHours };
