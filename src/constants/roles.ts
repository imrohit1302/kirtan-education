export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export const ALL_ROLES: [UserRole, ...UserRole[]] = [ROLES.USER, ROLES.ADMIN];

export const OTP_REASONS = {
  ACCOUNT_VERIFY: 'account_verify',
  PASSWORD_RESET: 'password_reset',
} as const;

export type OtpReason = (typeof OTP_REASONS)[keyof typeof OTP_REASONS];
export const ALL_OTP_REASONS: [OtpReason, ...OtpReason[]] = [
  OTP_REASONS.ACCOUNT_VERIFY,
  OTP_REASONS.PASSWORD_RESET,
];

export const DEVICE_TYPES = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];
export const ALL_DEVICE_TYPES: [DeviceType, ...DeviceType[]] = [
  DEVICE_TYPES.IOS,
  DEVICE_TYPES.ANDROID,
  DEVICE_TYPES.WEB,
];

export const SOCIAL_TYPES = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
} as const;

export type SocialType = (typeof SOCIAL_TYPES)[keyof typeof SOCIAL_TYPES];
export const ALL_SOCIAL_TYPES: [SocialType, ...SocialType[]] = [
  SOCIAL_TYPES.GOOGLE,
  SOCIAL_TYPES.FACEBOOK,
  SOCIAL_TYPES.APPLE,
];

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

