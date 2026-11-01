import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const BCRYPT_SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

export const generateCryptoRandomToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const hashSha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

