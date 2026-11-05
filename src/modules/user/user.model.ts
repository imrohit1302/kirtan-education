import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  ALL_DEVICE_TYPES,
  ALL_OTP_REASONS,
  ALL_ROLES,
  ALL_SOCIAL_TYPES,
  DEVICE_TYPES,
  ROLES,
} from '../../constants/roles.js';
import { IUser } from '../../types/index.js';
import { getOtpExpiry } from '../../utils/otp.util.js';
import { comparePassword, hashPassword } from '../../utils/password.util.js';

export interface IUserDocument extends IUser, Document {
  setOtp(otp: string, reason: string, minutes?: number): void;
  clearOtp(): void;
}

export interface IUserModel extends Model<IUserDocument> {
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
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
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    userProfile: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: String,
      trim: true,
      default: '+91',
    },
    isoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'IN',
    },
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: 'Role `{VALUE}` is not supported. Must be user or admin.',
      },
      default: ROLES.USER,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpReason: {
      type: String,
      enum: {
        values: ALL_OTP_REASONS,
        message: 'OTP Reason `{VALUE}` is not supported',
      },
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    deviceType: {
      type: String,
      enum: {
        values: ALL_DEVICE_TYPES,
        message: 'Device type `{VALUE}` is not supported. Must be ios, android, or web.',
      },
      default: DEVICE_TYPES.WEB,
    },
    deviceToken: {
      type: String,
      trim: true,
    },
    socialType: {
      type: String,
      enum: {
        values: ALL_SOCIAL_TYPES,
        message: 'Social type `{VALUE}` is not supported. Must be google, facebook, or apple.',
      },
    },
    socialId: {
      type: String,
      trim: true,
      index: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.password;
        delete ret.otp;
        delete ret.otpReason;
        delete ret.otpExpiry;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ socialType: 1, socialId: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  this.password = await hashPassword(this.password);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

userSchema.methods.isPasswordMatch = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return comparePassword(candidatePassword, this.password);
};

userSchema.methods.isPasswordChangedAfter = function (jwtIssuedAt: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtIssuedAt < changedTimestamp;
  }
  return false;
};

userSchema.methods.setOtp = function (otp: string, reason: string, minutes: number = 10): void {
  this.otp = otp;
  this.otpReason = reason;
  this.otpExpiry = getOtpExpiry(minutes);
};

userSchema.methods.clearOtp = function (): void {
  this.otp = undefined;
  this.otpReason = undefined;
  this.otpExpiry = undefined;
};

userSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const user = await this.findOne({
    email: email.toLowerCase(),
    isAccountVerified: true,
    _id: { $ne: excludeUserId },
  });
  return !!user;
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
