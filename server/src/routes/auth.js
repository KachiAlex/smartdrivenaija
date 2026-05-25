import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import pool from '../db/pool.js';
import { validate } from '../middleware/validation.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, role: user.role },
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

async function sendOTP(identifier, phone, email, deliveryMethod) {
  const normalizedMethod = deliveryMethod?.toLowerCase() || 'sms';
  const allowSms = normalizedMethod === 'sms' || normalizedMethod === 'both';
  const allowEmail = normalizedMethod === 'email' || normalizedMethod === 'both';

  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const code = generateOTP(parseInt(process.env.OTP_LENGTH || '6'));

  await pool.query(
    `UPDATE otp_codes SET verified = true WHERE phone = $1 AND verified = false`,
    [identifier]
  );

  await pool.query(
    `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
    [identifier, code, expiresAt]
  );

  const sentVia = [];
  const termiiApiKey = process.env.TERMII_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (allowSms && termiiApiKey && termiiApiKey !== 'your_termii_api_key' && phone) {
    try {
      const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
      const response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: termiiApiKey,
          to: cleanPhone,
          sms: `Your SmartDrive Naija code is: ${code}. Expires in ${expiryMinutes} mins.`,
          type: 'plain',
          channel: 'generic',
        }),
      });
      if (response.ok) sentVia.push('sms');
    } catch (e) { console.error('SMS failed:', e.message); }
  }

  if (allowEmail && resendApiKey && resendApiKey !== 're_dev_placeholder' && email) {
    try {
      const resend = new Resend(resendApiKey);
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: 'SmartDrive Naija - Verification Code',
        text: `Your code is: ${code}. Expires in ${expiryMinutes} minutes.`,
      });
      if (result?.id) sentVia.push('email');
    } catch (e) { console.error('Email failed:', e.message); }
  }

  console.log(`[OTP] ${identifier}: ${code}`);
  return { code, sentVia, expiresIn: expiryMinutes * 60 };
}

// ============================================================================
// REGISTRATION FLOW
// ============================================================================

// Step 1: Init registration - send OTP
router.post('/register/init', validate('registerInit'), async (req, res, next) => {
  try {
    const { phone, email, deliveryMethod = 'sms' } = req.body;
    const cleanPhone = phone ? phone.replace(/\s/g, '') : null;

    // Check for existing account by phone OR email
    const existing = await pool.query(
      `SELECT id FROM users WHERE phone = $1 OR email = $2`,
      [cleanPhone, email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Account already exists with this phone or email. Please login instead.' });
    }

    const otpResult = await sendOTP(cleanPhone, cleanPhone, email, deliveryMethod);

    res.json({
      message: otpResult.sentVia.length > 0 ? 'OTP sent' : 'OTP generated (check logs)',
      sentVia: otpResult.sentVia.length > 0 ? otpResult.sentVia : ['console'],
      expiresIn: otpResult.expiresIn,
      _dev_otp: otpResult.code,
    });
  } catch (err) { next(err); }
});

// Step 2: Verify OTP - return temp token to complete registration
router.post('/register/verify-otp', validate('otpVerify'), async (req, res, next) => {
  try {
    const { phone, email, code } = req.body;
    const identifier = email || phone;

    const otpResult = await pool.query(
      `SELECT id, code, attempts FROM otp_codes 
       WHERE phone = $1 AND verified = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [identifier]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No valid OTP. Please request a new code.' });
    }

    const otpRecord = otpResult.rows[0];
    if (otpRecord.attempts >= 5) {
      await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);
      return res.status(429).json({ error: 'Too many attempts. Request new code.' });
    }

    await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otpRecord.id]);

    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'Invalid code', attemptsRemaining: 5 - otpRecord.attempts - 1 });
    }

    await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);

    const tempToken = jwt.sign(
      { phone: phone || null, email: email || null, type: 'registration', iat: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'OTP verified',
      tempToken,
      expiresIn: 900,
    });
  } catch (err) { next(err); }
});

// Step 3: Complete registration - set password and profile
router.post('/register/complete', validate('registerComplete'), async (req, res, next) => {
  try {
    const { tempToken, password, fullName, state } = req.body;

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token. Please restart registration.' });
    }

    if (payload.type !== 'registration') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { phone: payloadPhone, email: payloadEmail } = payload;
    const identifier = payloadPhone || payloadEmail;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (phone, email, password_hash, full_name, state, password_set_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [payloadPhone || null, payloadEmail || null, passwordHash, fullName, state]
    );

    const user = result.rows[0];
    const tokens = generateTokens(user);

    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, refreshExpiry]
    );

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        preferredLanguage: user.preferred_language,
        isPremium: user.is_premium,
        xpTotal: user.xp_total,
        streakCurrent: user.streak_current,
        onboardingCompleted: user.onboarding_completed,
      },
      isNewUser: true,
    });
  } catch (err) { next(err); }
});

// ============================================================================
// LOGIN FLOW
// ============================================================================

// Standard login with email/phone + password
router.post('/login', validate('login'), async (req, res, next) => {
  try {
    const { identifier, password, deviceFingerprint, deviceName } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password required' });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    const userResult = await pool.query(
      `SELECT * FROM users WHERE ${isEmail ? 'email = $1' : 'phone = $1'}`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Password not set',
        code: 'PASSWORD_NOT_SET',
        message: 'Please use OTP login or reset your password',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = generateTokens(user);

    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, refreshExpiry]
    );

    if (deviceFingerprint) {
      await pool.query(
        `INSERT INTO trusted_devices (user_id, device_fingerprint, device_name, last_used_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, device_fingerprint)
         DO UPDATE SET last_used_at = NOW()`,
        [user.id, deviceFingerprint, deviceName || 'Unknown Device']
      );
    }

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        preferredLanguage: user.preferred_language,
        isPremium: user.is_premium,
        xpTotal: user.xp_total,
        streakCurrent: user.streak_current,
        onboardingCompleted: user.onboarding_completed,
      },
    });
  } catch (err) { next(err); }
});

// OTP-based login (for passwordless users or fallback)
router.post('/login/otp-request', validate('otpRequest'), async (req, res, next) => {
  try {
    const { phone, email, deliveryMethod = 'sms' } = req.body;
    const identifier = email || phone;

    if (!identifier) return res.status(400).json({ error: 'Phone or email required' });

    const userResult = await pool.query(
      `SELECT id FROM users WHERE ${email ? 'email = $1' : 'phone = $1'}`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    const otpResult = await sendOTP(identifier, phone, email, deliveryMethod);

    res.json({
      message: otpResult.sentVia.length > 0 ? 'OTP sent' : 'OTP generated (check logs)',
      sentVia: otpResult.sentVia.length > 0 ? otpResult.sentVia : ['console'],
      expiresIn: otpResult.expiresIn,
      _dev_otp: otpResult.code,
    });
  } catch (err) { next(err); }
});

router.post('/login/otp-verify', validate('otpVerify'), async (req, res, next) => {
  try {
    const { phone, email, code, deviceFingerprint, deviceName } = req.body;
    const identifier = email || phone;

    const otpResult = await pool.query(
      `SELECT id, code, attempts FROM otp_codes 
       WHERE phone = $1 AND verified = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [identifier]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No valid OTP. Please request a new code.' });
    }

    const otpRecord = otpResult.rows[0];
    if (otpRecord.attempts >= 5) {
      await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);
      return res.status(429).json({ error: 'Too many attempts. Request new code.' });
    }

    await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otpRecord.id]);

    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'Invalid code', attemptsRemaining: 5 - otpRecord.attempts - 1 });
    }

    await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const userResult = await pool.query(
      `SELECT * FROM users WHERE ${isEmail ? 'email = $1' : 'phone = $1'}`,
      [identifier]
    );
    const user = userResult.rows[0];

    const tokens = generateTokens(user);

    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, refreshExpiry]
    );

    if (deviceFingerprint) {
      await pool.query(
        `INSERT INTO trusted_devices (user_id, device_fingerprint, device_name, last_used_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, device_fingerprint)
         DO UPDATE SET last_used_at = NOW()`,
        [user.id, deviceFingerprint, deviceName || 'Unknown Device']
      );
    }

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        preferredLanguage: user.preferred_language,
        isPremium: user.is_premium,
        xpTotal: user.xp_total,
        streakCurrent: user.streak_current,
        onboardingCompleted: user.onboarding_completed,
      },
    });
  } catch (err) { next(err); }
});

// ============================================================================
// PASSWORD RESET FLOW
// ============================================================================

router.post('/password-reset/request', validate('otpRequest'), async (req, res, next) => {
  try {
    const { phone, email, deliveryMethod = 'sms' } = req.body;
    const cleanPhone = phone ? phone.replace(/\s/g, '') : null;
    const identifier = cleanPhone || email;

    // Look up user by phone OR email
    const userResult = await pool.query(
      `SELECT id, phone, email FROM users WHERE phone = $1 OR email = $2`,
      [cleanPhone || null, email || null]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with those details' });
    }

    // Use the stored phone/email from the user record for sending
    const storedUser = userResult.rows[0];
    const otpIdentifier = identifier;
    const otpPhone = storedUser.phone || cleanPhone;
    const otpEmail = storedUser.email || email;

    const otpResult = await sendOTP(otpIdentifier, otpPhone, otpEmail, deliveryMethod);

    res.json({
      message: otpResult.sentVia.length > 0 ? 'Reset code sent' : 'Code generated (check logs)',
      sentVia: otpResult.sentVia.length > 0 ? otpResult.sentVia : ['console'],
      expiresIn: otpResult.expiresIn,
      _dev_otp: otpResult.code,
    });
  } catch (err) { next(err); }
});

router.post('/password-reset/confirm', validate('passwordReset'), async (req, res, next) => {
  try {
    const { phone, email, code, newPassword } = req.body;
    const cleanPhone = phone ? phone.replace(/\s/g, '') : null;
    const identifier = cleanPhone || email;

    // Find OTP — stored under phone OR email as the identifier
    const otpResult = await pool.query(
      `SELECT id, code, attempts FROM otp_codes
       WHERE phone = $1 AND verified = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [identifier]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No valid code. Please request a new one.', code: 'OTP_EXPIRED' });
    }

    const otpRecord = otpResult.rows[0];
    if (otpRecord.attempts >= 5) {
      await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);
      return res.status(429).json({ error: 'Too many attempts. Request a new code.', code: 'TOO_MANY_ATTEMPTS' });
    }

    await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otpRecord.id]);

    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'Invalid code', attemptsRemaining: 5 - otpRecord.attempts - 1 });
    }

    await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [otpRecord.id]);

    // Find the user by phone OR email
    const userResult = await pool.query(
      `SELECT id FROM users WHERE phone = $1 OR email = $2`,
      [cleanPhone || null, email || null]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await pool.query(
      `UPDATE users SET password_hash = $1, password_set_at = NOW() WHERE id = $2`,
      [passwordHash, userResult.rows[0].id]
    );

    res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (err) { next(err); }
});

// ============================================================================
// CHANGE PASSWORD (Authenticated)
// ============================================================================

import { authenticate } from '../middleware/auth.js';

router.post('/change-password', authenticate, validate('changePassword'), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userResult = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    const user = userResult.rows[0];

    if (user.password_hash) {
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await pool.query(
      `UPDATE users SET password_hash = $1, password_set_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

// ============================================================================
// REFRESH & LOGOUT
// ============================================================================

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

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
    await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE token = $1`, [refreshToken]);

    const tokens = generateTokens({ id: user.user_id, phone: user.phone, role: user.role });

    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.user_id, tokens.refreshToken, refreshExpiry]
    );

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) { next(err); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE token = $1`, [refreshToken]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

export default router;
