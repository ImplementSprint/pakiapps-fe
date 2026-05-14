const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyPaymentMethods,
  linkGCash,
  removePaymentMethod,
  setDefaultPaymentMethod,
} = require('../controllers/paymentMethodController');

router.get('/',                  protect, getMyPaymentMethods);
router.post('/gcash',            protect, linkGCash);
router.delete('/:id',            protect, removePaymentMethod);
router.patch('/:id/default',     protect, setDefaultPaymentMethod);

module.exports = router;
