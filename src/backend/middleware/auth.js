'use strict';
/**
 * auth.js — JWT middleware (Supabase edition)
 * ============================================
 * Supabase-issued JWTs are verified using SUPABASE_JWT_SECRET.
 * After verification the matching account.users profile row is attached
 * to req.user so the rest of the app sees the same shape as before.
 */

const { getSupabaseClient } = require('../config/supabaseClient');
const { sequelize } = require('../config/db');

/**
 * Protect routes — verify Supabase JWT and attach profile to request.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // Verify using Supabase SDK instead of manual jwt verification
    const supabase = getSupabaseClient();
    const { data: { user: authUser }, error: verifyError } = await supabase.auth.getUser(token);

    if (verifyError || !authUser) {
      console.error('[Auth Middleware] Token invalid:', verifyError?.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }

    // authUser.id is the auth.users uuid
    const authId = authUser.id;

    // Fetch the public.users profile linked to this auth identity
    const [rows] = await sequelize.query(
      `SELECT * FROM public.users WHERE "supabaseId" = :authId LIMIT 1`,
      { replacements: { authId } },
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'User profile not found' });
    }

    if (user.deletedAt) {
      return res.status(401).json({ success: false, message: 'This account has been deleted' });
    }

    // Attach to request — expose both .id and ._id for compatibility
    req.user      = user;
    req.user._id  = user.id;
    req.user.authId = authId;

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
