import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../../constants/roles.js';
import {
  hashPassword,
  comparePassword,
  generateCryptoRandomToken,
  hashSha256,
} from '../../utils/password.util.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Never expose password hash in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: 'Role `{VALUE}` is not supported',
      },
      default: ROLES.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ passwordResetToken: 1 });

/**
 * Pre-save middleware to hash password and track password changes
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await hashPassword(this.password);

  // If this is an existing user updating their password, set passwordChangedAt
  if (!this.isNew) {
    // 1000ms buffer ensures token issued right after password reset has timestamp >= passwordChangedAt
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

/**
 * Instance method to verify password
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (candidatePassword) {
  return comparePassword(candidatePassword, this.password);
};

/**
 * Instance method to check if password changed after token was issued
 * @param {number} jwtIssuedAt - iat in seconds
 * @returns {boolean}
 */
userSchema.methods.isPasswordChangedAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtIssuedAt < changedTimestamp;
  }
  return false;
};

/**
 * Instance method to generate password reset token
 * @returns {string} unhashed token to send via email
 */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = generateCryptoRandomToken(32);

  // Store hashed token in DB for protection in case of database leakage
  this.passwordResetToken = hashSha256(resetToken);
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

/**
 * Static method to check if email is already taken
 * @param {string} email
 * @param {string} [excludeUserId]
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

export const User = mongoose.model('User', userSchema);
