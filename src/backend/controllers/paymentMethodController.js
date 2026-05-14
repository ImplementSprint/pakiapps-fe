'use strict';
/**
 * paymentMethodController.js
 * ==========================
 * SCRUM-1014 — GCash Link
 * SCRUM-1018 — Auto-Charge (pre-select saved method at booking)
 *
 * Routes:
 *   GET    /api/payment-methods              — list user's saved methods
 *   POST   /api/payment-methods/gcash        — link a GCash number
 *   DELETE /api/payment-methods/:id          — unlink / remove
 *   PATCH  /api/payment-methods/:id/default  — set as default
 */

const { PaymentMethod } = require('../models/index');

/** PH mobile: 09XXXXXXXXX or +639XXXXXXXXX */
const PH_MOBILE_RE = /^(\+639|09)\d{9}$/;

// ── GET /api/payment-methods ──────────────────────────────────────────────────
const getMyPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']],
    });
    res.json({ success: true, data: methods.map((m) => m.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/payment-methods/gcash ───────────────────────────────────────────
const linkGCash = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'mobileNumber is required' });
    }
    const cleaned = mobileNumber.trim();
    if (!PH_MOBILE_RE.test(cleaned)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PH mobile number. Use 09XXXXXXXXX or +639XXXXXXXXX format.',
      });
    }

    // Prevent duplicate GCash number for same user
    const existing = await PaymentMethod.findOne({
      where: { userId: req.user.id, provider: 'GCash', mobileNumber: cleaned },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This GCash number is already linked to your account.',
      });
    }

    // Is this the user's first saved method? Auto-set as default.
    const count = await PaymentMethod.count({ where: { userId: req.user.id } });

    // Masked label: "GCash •••• 1234" (last 4 digits)
    const last4 = cleaned.slice(-4);
    const displayLabel = `GCash •••• ${last4}`;

    const method = await PaymentMethod.create({
      userId:       req.user.id,
      provider:     'GCash',
      mobileNumber:  cleaned,
      displayLabel:  displayLabel,
      isDefault:    count === 0,  // first method is auto-default
    });

    res.status(201).json({ success: true, data: method.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/payment-methods/:id ──────────────────────────────────────────
const removePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    const wasDefault = method.isDefault;
    await method.destroy();

    // If removed method was default, promote the oldest remaining one
    if (wasDefault) {
      const next = await PaymentMethod.findOne({
        where:  { userId: req.user.id },
        order:  [['createdAt', 'ASC']],
      });
      if (next) await next.update({ isDefault: true });
    }

    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/payment-methods/:id/default ───────────────────────────────────
const setDefaultPaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // Unset all defaults for this user, then set this one
    await PaymentMethod.update({ isDefault: false }, { where: { userId: req.user.id } });
    await method.update({ isDefault: true });

    res.json({ success: true, data: method.toJSON(), message: 'Default payment method updated' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyPaymentMethods,
  linkGCash,
  removePaymentMethod,
  setDefaultPaymentMethod,
};
