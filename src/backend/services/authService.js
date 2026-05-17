'use strict';
/**
 * authService.js — Supabase Auth edition
 * =======================================
 * Auth lives in Supabase auth.users.
 * Profile data lives in public.users (integer PK, supabaseId UUID link).
 *
 * Flow:
 *   signUp  → supabase.auth.admin.createUser() → inserts into auth.users
 *           → upserts matching row in public.users (supabaseId = auth.user.id)
 *
 *   login   → supabase.auth.signInWithPassword() → validates via auth.users
 *           → fetches profile from public.users WHERE "supabaseId" = auth.user.id
 *           → returns Supabase access_token (JWT)
 */

const { getSupabaseClient } = require('../config/supabaseClient');
const { sequelize }         = require('../config/db');
const { logUserLogin, logUserRegistered } = require('./logService');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upsert a row in public.users keyed by supabaseId (UUID).
 */
async function upsertProfile(authId, defaults = {}) {
  const [rows] = await sequelize.query(
    `INSERT INTO public.users (name, email, phone, role, "isVerified", "supabaseId", password, "createdAt", "updatedAt")
     VALUES (:name, :email, :phone, :role, :isVerified, :authId, :password, now(), now())
     ON CONFLICT ("supabaseId") DO UPDATE
       SET name        = EXCLUDED.name,
           email       = EXCLUDED.email,
           phone       = COALESCE(EXCLUDED.phone, public.users.phone),
           "updatedAt" = now()
     RETURNING *`,
    {
      replacements: {
        authId,
        name:       defaults.name       || '',
        email:      defaults.email      || '',
        phone:      defaults.phone      || null,
        role:       defaults.role       || 'customer',
        isVerified: defaults.isVerified ?? false,
        password:   '[SUPABASE_MANAGED]',
      },
    },
  );
  return rows[0];
}

/**
 * Fetch a profile row by supabaseId.
 */
async function getProfileByAuthId(authId) {
  const [rows] = await sequelize.query(
    `SELECT * FROM public.users WHERE "supabaseId" = :authId LIMIT 1`,
    { replacements: { authId } },
  );
  return rows[0] || null;
}

// ── Register Customer ─────────────────────────────────────────────────────────

const registerCustomer = async ({ name, email, phone, password }) => {
  const supabase = getSupabaseClient();

  // 1. Create user in Supabase auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, role: 'customer' },
  });

  if (authError) throw new Error(authError.message);

  const authUser = authData.user;

  // 2. Upsert profile in public.users
  const profile = await upsertProfile(authUser.id, {
    name,
    email: authUser.email,
    phone,
    role: 'customer',
    isVerified: false,
  });

  logUserRegistered({ userId: profile.id, role: 'customer' });

  // 3. Sign in to get session token
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(signInError.message);

  return buildResponse(profile, authUser.id, session.session);
};

// ── Register Admin / Partner / Teller ────────────────────────────────────────

const registerAdmin = async ({ name, email, phone, password, accessCode, role: requestedRole }) => {
  if (accessCode !== process.env.ADMIN_ACCESS_CODE) {
    throw new Error('Invalid admin access code');
  }

  const finalRole = ['admin', 'teller', 'business_partner'].includes(requestedRole)
    ? requestedRole
    : 'admin';

  const supabase = getSupabaseClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, role: finalRole },
  });

  if (authError) throw new Error(authError.message);

  const authUser = authData.user;

  const profile = await upsertProfile(authUser.id, {
    name,
    email: authUser.email,
    phone,
    role: finalRole,
    isVerified: true,
  });

  logUserRegistered({ userId: profile.id, role: finalRole });

  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(signInError.message);

  return buildResponse(profile, authUser.id, session.session);
};

// ── Login ─────────────────────────────────────────────────────────────────────

const loginUser = async ({ email, password }) => {
  const supabase = getSupabaseClient();

  const { data: session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error('Invalid credentials. Please check your email and password.');

  const authUser = session.user;

  // Fetch profile from public.users
  let profile = await getProfileByAuthId(authUser.id);

  if (!profile) {
    // Maybe the user exists in public.users but supabaseId is null? Look up by email.
    const [existingRows] = await sequelize.query(
      `SELECT * FROM public.users WHERE email = :email LIMIT 1`,
      { replacements: { email: authUser.email } }
    );

    if (existingRows.length > 0) {
      // User exists! Link their supabaseId.
      await sequelize.query(
        `UPDATE public.users SET "supabaseId" = :authId WHERE id = :id`,
        { replacements: { authId: authUser.id, id: existingRows[0].id } }
      );
      profile = { ...existingRows[0], supabaseId: authUser.id };
    } else {
      // Completely new user: create row.
      profile = await upsertProfile(authUser.id, {
        name:  authUser.user_metadata?.name  || authUser.email.split('@')[0],
        email: authUser.email,
        phone: authUser.user_metadata?.phone || null,
        role:  authUser.user_metadata?.role  || 'customer',
        isVerified: true,
      });
    }
  }

  logUserLogin({ userId: profile.id, role: profile.role });

  return buildResponse(profile, authUser.id, session.session);
};

function buildResponse(profile, authId, session) {
  return {
    _id:            String(profile.id),
    authId,
    name:           profile.name,
    email:          profile.email,
    role:           profile.role,
    profilePicture: profile.profilePicture || null,
    token:          session.access_token,
    refreshToken:   session.refresh_token,
    expiresAt:      session.expires_at,
  };
}

// ── Token Refresh ─────────────────────────────────────────────────────────────

const refreshToken = async ({ refreshToken: rt }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: rt });
  if (error) throw new Error('Invalid or expired refresh token');
  return {
    token:        data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt:    data.session.expires_at,
  };
};

// ── Logout ────────────────────────────────────────────────────────────────────

const logoutUser = async ({ refreshToken: rt }) => {
  const supabase = getSupabaseClient();
  await supabase.auth.admin.signOut(rt).catch(() => null);
  return { success: true };
};

module.exports = { registerCustomer, registerAdmin, loginUser, refreshToken, logoutUser };