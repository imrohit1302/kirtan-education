import crypto from 'node:crypto';

/**
 * Generate a cryptographically secure numeric OTP
 * @param length - Length of OTP (defaults to 6 digits)
 */
export const generateNumericOtp = (length: number = 6): string => {
  if (length === 4) {
    return crypto.randomInt(1000, 9999).toString();
  }
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Calculate OTP expiration timestamp (default: 10 minutes)
 */
export const getOtpExpiry = (minutes: number = 10): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if given expiry timestamp has passed
 */
export const isOtpExpired = (expiry?: Date): boolean => {
  if (!expiry) return true;
  return new Date() > new Date(expiry);
};
