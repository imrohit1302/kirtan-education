import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
export const hashPassword = async password => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plain text password against hashed password
 * @param {string} candidatePassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

/**
 * Generate a secure cryptographically random hexadecimal token
 * @param {number} bytes - Number of random bytes (default 32)
 * @returns {string}
 */
export const generateCryptoRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash data using SHA-256 (useful for indexing reset tokens securely in DB)
 * @param {string} data
 * @returns {string}
 */
export const hashSha256 = data => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
