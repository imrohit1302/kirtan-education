import { Request } from 'express';
import { Types } from 'mongoose';
import { DeviceType, SocialType, UserRole } from '../constants/roles.js';

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  countryCode?: string;
  isoCode?: string;
  userProfile?: string | null;
  role: UserRole;
  isAccountVerified: boolean;
  otp?: string;
  otpReason?: string;
  otpExpiry?: Date;
  deviceType: DeviceType;
  deviceToken?: string;
  socialType?: SocialType;
  socialId?: string;
  refreshToken?: string;
  passwordChangedAt?: Date;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  isPasswordMatch(candidatePassword: string): Promise<boolean>;
  isPasswordChangedAfter(jwtIssuedAt: number): boolean;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: string;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export type { ICategoryDocument } from '../modules/category/category.model.js';
export type { IRoleDocument } from '../modules/role/role.model.js';
export type { IRaagDocument } from '../modules/raag/raag.model.js';
export type { ITutorialDocument } from '../modules/tutorial/tutorial.model.js';
export type { IBookDocument } from '../modules/book/book.model.js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: IUser;
    }
  }
}
