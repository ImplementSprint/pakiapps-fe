const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOperatingHours,
  upsertOperatingHours,
} = require('../controllers/operatingHoursController');

// Public — any authenticated user can view a location's hours
router.get('/:locationId',  protect, getOperatingHours);

// Partner or admin only
router.put('/:locationId',  protect, upsertOperatingHours);

module.exports = router;
