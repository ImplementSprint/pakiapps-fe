#!/usr/bin/env node
/**
 * stress-test.js — Account creation + Email & SMS stress test
 * ============================================================
 * Run from: src/Backend/
 *   node ../../scratch/stress-test.js
 * Or from project root:
 *   node scratch/stress-test.js
 *
 * Tests:
 *  1. Register customer account
 *  2. Login with email
 *  3. Login with phone
 *  4. Send booking confirmation email (API Center → SMTP fallback)
 *  5. Send OTP SMS (API Center → Semaphore fallback)
 *  6. Send booking confirmation SMS
 *  7. Send password reset email
 *  8. API Center ping / health
 */

'use strict';
const path = require('path');

// Resolve the Backend directory regardless of where this script is called from
const BACKEND_DIR = path.join(__dirname, '../src/Backend');

require('dotenv').config({ path: path.join(BACKEND_DIR, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const http     = require('http');


// ── Target account ────────────────────────────────────────────────────────────
const TARGET = {
  firstName: 'Jero',
  lastName:  'Roaring',
  email:     'srjeroaring2@gmail.com',
  phone:     '+639561531475',    // canonical +63 format
  password:  'Joshua19$',
};

// ── Pretty logger ─────────────────────────────────────────────────────────────
const PASS = (label) => console.log(`  ✅  ${label}`);
const FAIL = (label, msg) => console.error(`  ❌  ${label}: ${msg}`);
const HEAD = (title) => console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`);

// ── HTTP helper ───────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (bodyStr)  headers['Content-Length'] = Buffer.byteLength(bodyStr);
    if (token)    headers['Authorization']  = `Bearer ${token}`;

    const opts = {
      hostname: 'localhost',
      port:     parseInt(process.env.PORT || '5000'),
      path:     '/api' + path,
      method,
      headers,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testHealthCheck() {
  HEAD('1. Health Check');
  const r = await request('GET', '/health');
  if (r.status === 200) {
    PASS(`Server OK | DB: ${r.body.db} | API Center: ${r.body.apiCenter || 'unknown'}`);
  } else {
    FAIL('Health check', `HTTP ${r.status}`);
  }
  return r.status === 200;
}

async function testRegister() {
  HEAD('2. Register Customer Account');
  const r = await request('POST', '/auth/register/customer', {
    firstName: TARGET.firstName,
    lastName:  TARGET.lastName,
    email:     TARGET.email,
    phone:     TARGET.phone,
    password:  TARGET.password,
  });

  if (r.status === 201 || r.status === 200) {
    PASS(`Registered | authId: ${r.body.authId || '(embedded)'} | role: ${r.body.role}`);
    return r.body.token;
  } else if (r.status === 409 || (r.body.message && r.body.message.toLowerCase().includes('already'))) {
    console.log(`  ℹ️   Already registered — continuing with login`);
    return null;
  } else {
    FAIL('Register', `HTTP ${r.status} — ${r.body?.message || JSON.stringify(r.body)}`);
    return null;
  }
}

async function testLoginEmail() {
  HEAD('3. Login with Email');
  const r = await request('POST', '/auth/login', {
    email:    TARGET.email,
    password: TARGET.password,
  });

  if (r.status === 200 && r.body.token) {
    PASS(`Login OK | role: ${r.body.role} | name: ${r.body.name || r.body.firstName}`);
    return r.body.token;
  } else {
    FAIL('Email login', `HTTP ${r.status} — ${r.body?.message || JSON.stringify(r.body)}`);
    return null;
  }
}

async function testLoginPhone() {
  HEAD('4. Login with Phone Number');
  const r = await request('POST', '/auth/login', {
    email:    TARGET.phone,   // auth route accepts phone as 'email' field
    password: TARGET.password,
  });

  if (r.status === 200 && r.body.token) {
    PASS(`Phone login OK | identifier: ${r.body.phone || r.body.identifier}`);
    return r.body.token;
  } else {
    FAIL('Phone login', `HTTP ${r.status} — ${r.body?.message || JSON.stringify(r.body)}`);
    return null;
  }
}

// Direct service tests — load services directly (bypasses HTTP)
async function testEmailDirect() {
  HEAD('5. Email Stress Test (Direct Service)');

  const emailService = require(path.join(BACKEND_DIR, 'services/emailService'));

  const mockBooking = {
    reference:    'PKP-TEST-001',
    userName:     `${TARGET.firstName} ${TARGET.lastName}`,
    location:     'PakiPark BGC',
    locationName: 'PakiPark BGC Hub',
    spot:         'A-12',
    date:         '2026-05-20',
    timeSlot:     '09:00 AM – 10:00 AM',
    amount:       150,
  };

  // Test 5a: Booking confirmation
  try {
    await emailService.sendBookingConfirmation(TARGET.email, mockBooking);
    PASS(`Booking confirmation → ${TARGET.email}`);
  } catch (e) { FAIL('Booking confirmation email', e.message); }

  // Test 5b: Password reset
  try {
    await emailService.sendPasswordReset(TARGET.email, 'test-reset-token-abc123');
    PASS(`Password reset email → ${TARGET.email}`);
  } catch (e) { FAIL('Password reset email', e.message); }

  // Test 5c: Booking reminder
  try {
    await emailService.sendBookingReminder(TARGET.email, mockBooking);
    PASS(`Booking reminder → ${TARGET.email}`);
  } catch (e) { FAIL('Booking reminder email', e.message); }

  // Test 5d: OTP email
  try {
    await emailService.sendOTPEmail(TARGET.email, '482910');
    PASS(`OTP email → ${TARGET.email}`);
  } catch (e) { FAIL('OTP email', e.message); }
}

async function testSMSDirect() {
  HEAD('6. SMS Stress Test (Direct Service + Semaphore)');

  const smsService = require(path.join(BACKEND_DIR, 'services/smsService'));

  // Test 6a: OTP send
  let otpPhone;
  try {
    otpPhone = await smsService.sendPasswordResetOTP(TARGET.phone);
    PASS(`OTP SMS dispatched → ${otpPhone}`);
  } catch (e) { FAIL('OTP SMS', e.message); }

  // Test 6b: Verify OTP (we don't know the real OTP so skip verify)
  console.log(`  ℹ️   OTP verification skipped (real OTP sent to ${TARGET.phone})`);

  // Test 6c: Booking confirmation SMS
  try {
    await smsService.sendBookingConfirmationSMS(TARGET.phone, {
      reference:    'PKP-TEST-001',
      locationName: 'PakiPark BGC Hub',
      spot:         'A-12',
      date:         '2026-05-20',
      timeSlot:     '09:00 AM',
      amount:       150,
    });
    PASS(`Booking confirmation SMS → ${TARGET.phone}`);
  } catch (e) { FAIL('Booking confirmation SMS', e.message); }

  // Test 6d: Reminder SMS
  try {
    await smsService.sendBookingReminderSMS(TARGET.phone, {
      reference:    'PKP-TEST-001',
      locationName: 'PakiPark BGC Hub',
      spot:         'A-12',
      date:         '2026-05-20',
      timeSlot:     '09:00 AM',
    });
    PASS(`Reminder SMS → ${TARGET.phone}`);
  } catch (e) { FAIL('Reminder SMS', e.message); }
}

async function testApiCenterPing() {
  HEAD('7. API Center Connectivity');
  const apiCenter = require(path.join(BACKEND_DIR, 'config/apiCenterClient'));
  try {
    const alive = await apiCenter.ping();
    if (alive) {
      PASS(`API Center reachable at ${process.env.APICENTER_URL}`);
    } else {
      console.log(`  ⚠️   API Center offline (services will use fallbacks)`);
    }
  } catch (e) {
    console.log(`  ⚠️   API Center ping failed: ${e.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  PakiPark Stress Test');
  console.log(`    Target account: ${TARGET.email} / ${TARGET.phone}`);
  console.log(`    Backend:        ${BASE_URL}`);

  const healthy = await testHealthCheck();
  if (!healthy) {
    console.error('\n❌  Backend server is not running. Start it first:\n    npm run dev  (in src/Backend)\n');
    process.exit(1);
  }

  // Account creation + auth
  let token = await testRegister();
  if (!token) token = await testLoginEmail();
  await testLoginPhone();

  // Communication channels
  await testEmailDirect();
  await testSMSDirect();
  await testApiCenterPing();

  console.log('\n' + '═'.repeat(60));
  console.log('  Stress test complete.');
  console.log('  Check your inbox at srjeroaring2@gmail.com');
  console.log(`  Check SMS at ${TARGET.phone}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
