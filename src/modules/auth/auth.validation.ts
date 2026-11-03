import { z } from 'zod';

export const signUpSchema = {
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').optional(),
    countryCode: z.string().trim().default('+91'),
    isoCode: z.string().trim().max(5).default('IN'),
    deviceType: z.enum(['ios', 'android', 'web']).default('web'),
    deviceToken: z.string().trim().optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
    deviceType: z.enum(['ios', 'android', 'web']).optional(),
    deviceToken: z.string().trim().optional(),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    otp: z.string().min(4, 'OTP must be at least 4 digits').max(6, 'OTP cannot exceed 6 digits'),
    otpReason: z.enum(['account_verify', 'password_reset']),
  }),
};

export const resendOtpSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    otpReason: z.enum(['account_verify', 'password_reset']).default('account_verify'),
  }),
};

export const forgetPasswordSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    otp: z.string().min(4).max(6),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
};

export const socialLoginSchema = {
  body: z.object({
    socialType: z.enum(['google', 'facebook', 'apple']),
    socialId: z.string().trim().min(1, 'socialId is required'),
    email: z.string().trim().email('Invalid email address format'),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    deviceType: z.enum(['ios', 'android', 'web']).default('web'),
    deviceToken: z.string().trim().optional(),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    })
    .refine(data => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
};

export const refreshTokenSchema = {
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
};

export const deleteAccountSchema = {
  body: z
    .object({
      password: z.string().optional(),
    })
    .optional(),
};
