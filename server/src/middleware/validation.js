// Plain JS validation — no external dependencies (safe for all deployment targets)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9]\d{6,14}$/;

function err(field, message) { return { field, message }; }

function runValidators(body, validators) {
  const issues = [];
  for (const v of validators) {
    const result = v(body);
    if (result) issues.push(result);
  }
  return issues;
}

// ── Schema definitions (plain validator arrays) ──────────────────────────────

const schemas = {
  login: [
    b => (!b.identifier || String(b.identifier).trim().length < 3) && err('identifier', 'Identifier required'),
    b => (!b.password || String(b.password).length < 6) && err('password', 'Password must be at least 6 characters'),
  ],

  otpRequest: [
    b => (!b.phone && !b.email) && err('phone', 'Phone or email required'),
    b => (b.email && !EMAIL_RE.test(b.email)) && err('email', 'Valid email required'),
    b => (b.phone && !PHONE_RE.test(String(b.phone).replace(/\s/g, ''))) && err('phone', 'Valid phone number required (e.g. +2348012345678)'),
    b => (b.deliveryMethod && !['sms', 'email', 'both'].includes(b.deliveryMethod)) && err('deliveryMethod', 'Must be sms, email, or both'),
  ],

  otpVerify: [
    b => (!b.phone && !b.email) && err('phone', 'Phone or email required'),
    b => (!b.code || String(b.code).length !== 6 || !/^\d{6}$/.test(b.code)) && err('code', 'OTP must be 6 digits'),
  ],

  registerComplete: [
    b => (!b.tempToken || String(b.tempToken).length < 10) && err('tempToken', 'Temp token required'),
    b => (!b.password || String(b.password).length < 6) && err('password', 'Password must be at least 6 characters'),
    b => (!b.fullName || String(b.fullName).trim().length < 2) && err('fullName', 'Full name required'),
  ],

  passwordReset: [
    b => (!b.phone && !b.email) && err('phone', 'Phone or email required'),
    b => (!b.code || String(b.code).length !== 6 || !/^\d{6}$/.test(b.code)) && err('code', 'OTP must be 6 digits'),
    b => (!b.newPassword || String(b.newPassword).length < 6) && err('newPassword', 'Password must be at least 6 characters'),
  ],

  changePassword: [
    b => (!b.currentPassword || String(b.currentPassword).length < 1) && err('currentPassword', 'Current password required'),
    b => (!b.newPassword || String(b.newPassword).length < 6) && err('newPassword', 'New password must be at least 6 characters'),
  ],
};

export { schemas };

// ── Middleware factory ────────────────────────────────────────────────────────

export function validate(schemaKey) {
  const validators = typeof schemaKey === 'string' ? schemas[schemaKey] : schemaKey;
  return (req, res, next) => {
    const issues = runValidators(req.body, validators).filter(Boolean);
    if (issues.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: issues,
      });
    }
    next();
  };
}
