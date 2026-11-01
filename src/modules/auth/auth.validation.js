import { z } from 'zod';
import { ALL_ROLES } from '../../constants/roles.js';

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;

const strongPasswordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password cannot exceed 64 characters')
  .regex(
    passwordPattern,
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
  );

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Invalid email address format'),
    password: strongPasswordValidation,
    role: z.enum(ALL_ROLES).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshTokenSchema = {
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: strongPasswordValidation,
    })
    .refine(data => data.currentPassword !== data.newPassword, {
      message: 'New password cannot be identical to your current password',
      path: ['newPassword'],
    }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: strongPasswordValidation,
  }),
};
