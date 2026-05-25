import { z } from 'zod';

// Common validators
export const schemas = {
  // Auth
  login: z.object({
    identifier: z.string().min(3, 'Identifier required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  otpRequest: z.object({
    phone: z.string().min(10, 'Valid phone number required').optional(),
    email: z.string().email('Valid email required').optional(),
    deliveryMethod: z.enum(['sms', 'email', 'both']).default('sms'),
  }).refine(data => data.phone || data.email, {
    message: 'Phone or email required',
  }),

  otpVerify: z.object({
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    code: z.string().length(6, 'OTP must be 6 digits'),
  }).refine(data => data.phone || data.email, {
    message: 'Phone or email required',
  }),

  registerComplete: z.object({
    tempToken: z.string().min(1, 'Temp token required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name required'),
    state: z.string().optional(),
  }),

  passwordReset: z.object({
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    code: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }).refine(data => data.phone || data.email, {
    message: 'Phone or email required',
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
};

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.validated = result.data;
    next();
  };
}
