import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

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

// ============================================================================
// REGISTER BIOMETRIC (Setup - requires authentication)
// ============================================================================

router.post('/register', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { credentialId, publicKey, deviceId, deviceName, deviceType, biometricType } = req.body;

    if (!credentialId || !publicKey || !deviceId) {
      return res.status(400).json({ error: 'credentialId, publicKey, and deviceId required' });
    }

    const existing = await pool.query(
      `SELECT id FROM biometric_credentials WHERE user_id = $1 AND credential_id = $2`,
      [userId, credentialId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE biometric_credentials SET public_key = $1, device_name = $2, device_type = $3,
         biometric_type = $4, is_active = TRUE, last_used_at = NOW()
         WHERE user_id = $5 AND credential_id = $6`,
        [publicKey, deviceName, deviceType, biometricType, userId, credentialId]
      );
      return res.json({ message: 'Biometric credential updated', credentialId });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM biometric_credentials WHERE user_id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum 5 biometric credentials allowed' });
    }

    await pool.query(
      `INSERT INTO biometric_credentials (user_id, credential_id, public_key, device_id, device_name, device_type, biometric_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, credentialId, publicKey, deviceId, deviceName, deviceType, biometricType]
    );

    res.status(201).json({ message: 'Biometric credential registered', credentialId });
  } catch (err) { next(err); }
});

// ============================================================================
// BIOMETRIC LOGIN (Challenge-Response)
// ============================================================================

// Step 1: Request challenge for biometric login
router.post('/login/challenge', async (req, res, next) => {
  try {
    const { deviceId, identifier } = req.body;

    if (!deviceId || !identifier) {
      return res.status(400).json({ error: 'deviceId and identifier (email/phone) required' });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.phone, u.full_name, u.role, u.preferred_language, u.is_premium, u.xp_total, u.streak_current, u.onboarding_completed,
              bc.credential_id, bc.public_key
       FROM users u
       JOIN biometric_credentials bc ON u.id = bc.user_id
       WHERE bc.device_id = $1 AND bc.is_active = TRUE AND ${isEmail ? 'u.email = $2' : 'u.phone = $2'}`,
      [deviceId, identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No biometric credential found for this device' });
    }

    const user = userResult.rows[0];
    const challenge = crypto.randomBytes(32).toString('base64');
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await pool.query(
      `INSERT INTO biometric_challenges (user_id, credential_id, challenge, expires_at) VALUES ($1, $2, $3, $4)`,
      [user.id, user.credential_id, challenge, expiresAt]
    );

    res.json({
      challenge,
      credentialId: user.credential_id,
      expiresIn: 120,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
      }
    });
  } catch (err) { next(err); }
});

// Step 2: Verify signature and login
router.post('/login/verify', async (req, res, next) => {
  try {
    const { deviceId, credentialId, challenge, signature } = req.body;

    if (!deviceId || !credentialId || !challenge || !signature) {
      return res.status(400).json({ error: 'deviceId, credentialId, challenge, and signature required' });
    }

    // Find and validate challenge
    const challengeResult = await pool.query(
      `SELECT bc.*, u.* FROM biometric_challenges bc
       JOIN users u ON bc.user_id = u.id
       WHERE bc.credential_id = $1 AND bc.challenge = $2 AND bc.used = FALSE AND bc.expires_at > NOW()`,
      [credentialId, challenge]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    const data = challengeResult.rows[0];

    // Get credential public key
    const credResult = await pool.query(
      `SELECT public_key FROM biometric_credentials WHERE credential_id = $1 AND device_id = $2 AND is_active = TRUE`,
      [credentialId, deviceId]
    );

    if (credResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credential' });
    }

    // Verify signature (RSA/ECDSA verification)
    const publicKey = credResult.rows[0].public_key;
    let signatureValid = false;

    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(challenge);
      signatureValid = verifier.verify(publicKey, signature, 'base64');
    } catch (e) {
      // If RSA fails, try ECDSA (different key format)
      try {
        const key = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' });
        signatureValid = crypto.verify('SHA256', Buffer.from(challenge), key, Buffer.from(signature, 'base64'));
      } catch (e2) {
        signatureValid = false;
      }
    }

    if (!signatureValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Mark challenge as used
    await pool.query(`UPDATE biometric_challenges SET used = TRUE WHERE id = $1`, [data.id]);

    // Update last used
    await pool.query(`UPDATE biometric_credentials SET last_used_at = NOW() WHERE credential_id = $1`, [credentialId]);

    // Generate tokens
    const tokens = generateTokens(data);

    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [data.user_id, tokens.refreshToken, refreshExpiry]
    );

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: data.user_id,
        email: data.email,
        phone: data.phone,
        fullName: data.full_name,
        role: data.role,
        preferredLanguage: data.preferred_language,
        isPremium: data.is_premium,
        xpTotal: data.xp_total,
        streakCurrent: data.streak_current,
        onboardingCompleted: data.onboarding_completed,
      },
    });
  } catch (err) { next(err); }
});

// ============================================================================
// MANAGE BIOMETRIC CREDENTIALS
// ============================================================================

router.get('/credentials', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT credential_id, device_name, device_type, biometric_type, is_active, created_at, last_used_at
       FROM biometric_credentials WHERE user_id = $1 ORDER BY last_used_at DESC`,
      [userId]
    );

    res.json({
      credentials: result.rows.map(r => ({
        credentialId: r.credential_id,
        deviceName: r.device_name,
        deviceType: r.device_type,
        biometricType: r.biometric_type,
        isActive: r.is_active,
        createdAt: r.created_at,
        lastUsedAt: r.last_used_at,
      }))
    });
  } catch (err) { next(err); }
});

router.delete('/credentials/:credentialId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { credentialId } = req.params;

    await pool.query(
      `DELETE FROM biometric_credentials WHERE user_id = $1 AND credential_id = $2`,
      [userId, credentialId]
    );

    res.json({ message: 'Biometric credential removed' });
  } catch (err) { next(err); }
});

router.patch('/credentials/:credentialId/deactivate', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { credentialId } = req.params;

    await pool.query(
      `UPDATE biometric_credentials SET is_active = FALSE WHERE user_id = $1 AND credential_id = $2`,
      [userId, credentialId]
    );

    res.json({ message: 'Biometric credential deactivated' });
  } catch (err) { next(err); }
});

// Cleanup old challenges (call periodically via cron)
router.post('/cleanup-challenges', async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM biometric_challenges WHERE expires_at < NOW() OR used = TRUE`
    );
    res.json({ cleaned: result.rowCount });
  } catch (err) { next(err); }
});

export default router;
