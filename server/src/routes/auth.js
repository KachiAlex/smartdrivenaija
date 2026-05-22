import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import pool from '../db/pool.js';

const router = Router();

function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, tokenId: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
}

// POST /auth/otp/request
router.post('/otp/request', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+234\d{10}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Valid Nigerian phone number required (+234XXXXXXXXXX)' });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const code = generateOTP(parseInt(process.env.OTP_LENGTH || '6'));
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate any existing unused OTPs for this phone
    await pool.query(
      `UPDATE otp_codes SET verified = true WHERE phone = $1 AND verified = false`,
      [cleanPhone]
    );

    // Store new OTP
    await pool.query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
      [cleanPhone, code, expiresAt]
    );

    // Send OTP via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here') {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'otp@smartdrivenaija.com',
        to: [`${cleanPhone}@sms.smartdrivenaija.com`], // SMS gateway integration point
        subject: 'SmartDrive Naija - Verification Code',
        text: `Your SmartDrive Naija verification code is: ${code}. It expires in ${expiryMinutes} minutes.`,
      });
    } else {
      // Development mode — log OTP to console
      console.log(`[DEV] OTP for ${cleanPhone}: ${code}`);
    }

    res.json({
      message: 'OTP sent successfully',
      expiresIn: expiryMinutes * 60,
      // Include OTP in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { _dev_otp: code }),
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code required' });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // Find valid OTP
    const otpResult = await pool.query(
      `SELECT id, code, attempts FROM otp_codes 
       WHERE phone = $1 AND verified = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No valid OTP found. Please request a new code.' });
    }

    const otpRecord = otpResult.rows[0];

    // Check max attempts
    if (otpRecord.attempts >= 5) {
      await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }

    // Increment attempts
    await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otpRecord.id]);

    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'Invalid OTP code', attemptsRemaining: 5 - otpRecord.attempts - 1 });
    }

    // Mark OTP as verified
    await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);

    // Find or create user
    let userResult = await pool.query(`SELECT * FROM users WHERE phone = $1`, [cleanPhone]);

    let isNewUser = false;
    if (userResult.rows.length === 0) {
      isNewUser = true;
      userResult = await pool.query(
        `INSERT INTO users (phone) VALUES ($1) RETURNING *`,
        [cleanPhone]
      );
    }

    const user = userResult.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshToken, refreshExpiry]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        preferredLanguage: user.preferred_language,
        isPremium: user.is_premium,
        xpTotal: user.xp_total,
        streakCurrent: user.streak_current,
        onboardingCompleted: user.onboarding_completed,
      },
      isNewUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token exists and is not revoked
    const tokenResult = await pool.query(
      `SELECT rt.*, u.* FROM refresh_tokens rt 
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.revoked = false AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token expired or revoked' });
    }

    const user = tokenResult.rows[0];

    // Revoke old token
    await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE token = $1`, [refreshToken]);

    // Issue new tokens
    const tokens = generateTokens({ id: user.user_id, phone: user.phone, role: user.role });

    // Store new refresh token
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.user_id, tokens.refreshToken, refreshExpiry]
    );

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE token = $1`, [refreshToken]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
