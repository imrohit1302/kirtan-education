import { envConfig } from '../../config/env.config.js';
import { OTP_REASONS, ROLES, TOKEN_TYPES } from '../../constants/roles.js';
import { ApiError } from '../../utils/apiError.js';
import { sendOtpEmail } from '../../utils/email.util.js';
import { generateNumericOtp, isOtpExpired } from '../../utils/otp.util.js';
import { generateAuthTokens, verifyJwt } from '../../utils/token.util.js';
import { User } from '../user/user.model.js';

export class AuthService {
  /**
   * User Sign Up with OTP generation and Email dispatch.
   * If a user previously signed up but did not verify their OTP,
   * treat this as a normal fresh signup attempt rather than throwing an error.
   */
  static async signUp(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    countryCode?: string;
    isoCode?: string;
    deviceType?: any;
    deviceToken?: string;
  }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.isAccountVerified) {
        throw ApiError.conflict('An account with this email address already exists.');
      }

      // User exists but has NOT verified OTP yet: treat as a normal fresh signup attempt
      existingUser.fullName = data.fullName;
      existingUser.password = data.password;
      if (data.phone) existingUser.phone = data.phone;
      if (data.countryCode) existingUser.countryCode = data.countryCode;
      if (data.isoCode) existingUser.isoCode = data.isoCode;
      if (data.deviceType) existingUser.deviceType = data.deviceType;
      if (data.deviceToken) existingUser.deviceToken = data.deviceToken;
      existingUser.isAccountVerified = false;

      const otp = generateNumericOtp(6);
      existingUser.setOtp(otp, OTP_REASONS.ACCOUNT_VERIFY, 10);

      const tokens = generateAuthTokens(existingUser);
      existingUser.refreshToken = tokens.refreshToken;
      await existingUser.save();

      // Dispatch real email via Gmail SMTP (non-blocking)
      sendOtpEmail({
        to: existingUser.email,
        fullName: existingUser.fullName,
        otp,
        reason: OTP_REASONS.ACCOUNT_VERIFY,
      }).catch(() => {});

      return {
        user: existingUser,
        tokens,
        otp,
        message: 'Account created successfully. Please verify your OTP sent to your email.',
      };
    }

    const otp = generateNumericOtp(6);

    const user = new User({
      fullName: data.fullName,
      email: normalizedEmail,
      password: data.password,
      phone: data.phone,
      countryCode: data.countryCode || '+91',
      isoCode: data.isoCode || 'IN',
      deviceType: data.deviceType || 'web',
      deviceToken: data.deviceToken,
      role: ROLES.USER,
      isAccountVerified: false,
    });

    user.setOtp(otp, OTP_REASONS.ACCOUNT_VERIFY, 10);

    const tokens = generateAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Dispatch real email via Gmail SMTP (non-blocking)
    sendOtpEmail({
      to: user.email,
      fullName: user.fullName,
      otp,
      reason: OTP_REASONS.ACCOUNT_VERIFY,
    }).catch(() => {});

    return {
      user,
      tokens,
      otp, // Exposed in response for instant Postman / local testing
      message: 'Account created successfully. Please verify your OTP sent to your email.',
    };
  }

  /**
   * User Login with email & password + device tracking
   */
  static async login(data: {
    email: string;
    password: string;
    deviceType?: any;
    deviceToken?: string;
  }) {
    const user = await User.findOne({ email: data.email }).select(
      '+password +isActive +loginAttempts +lockUntil'
    );

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated. Please contact support.');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw ApiError.forbidden(
        `Account temporarily locked due to consecutive failed attempts. Try again in ${waitMinutes} minute(s).`
      );
    }

    const isMatch = await user.isPasswordMatch(data.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save({ validateBeforeSave: false });
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    if (data.deviceType) user.deviceType = data.deviceType;
    if (data.deviceToken) user.deviceToken = data.deviceToken;

    const tokens = generateAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user,
      tokens,
      isAccountVerified: user.isAccountVerified,
      message: user.isAccountVerified
        ? 'Login successful.'
        : 'Login successful. Note: Your account is pending OTP verification.',
    };
  }

  /**
   * Verify OTP for Account Verification or Password Reset
   */
  static async verifyOtp(data: { email: string; otp: string; otpReason: string }) {
    const user = await User.findOne({ email: data.email }).select('+otp +otpReason +otpExpiry');

    if (!user) {
      throw ApiError.notFound('No account found with this email address.');
    }

    if (!user.otp || !user.otpExpiry) {
      throw ApiError.badRequest('No pending OTP request found for this account.');
    }

    if (user.otpReason !== data.otpReason) {
      throw ApiError.badRequest(
        `Invalid OTP reason. Expected '${user.otpReason}', but received '${data.otpReason}'.`
      );
    }

    if (isOtpExpired(user.otpExpiry)) {
      throw ApiError.badRequest('The OTP has expired. Please request a new OTP.');
    }

    if (user.otp !== data.otp) {
      throw ApiError.badRequest('Invalid OTP entered. Please try again.');
    }

    if (data.otpReason === OTP_REASONS.ACCOUNT_VERIFY) {
      user.isAccountVerified = true;
      user.clearOtp();
      const tokens = generateAuthTokens(user);
      user.refreshToken = tokens.refreshToken;
      await user.save({ validateBeforeSave: false });

      return {
        user,
        tokens,
        message: 'Account successfully verified! Welcome to Kirtan Education.',
      };
    }

    return {
      message: 'OTP verified successfully. You can now set your new password.',
    };
  }

  /**
   * Resend OTP for either Account Verification or Password Reset
   */
  static async resendOtp(email: string, otpReason: string = OTP_REASONS.ACCOUNT_VERIFY) {
    const user = await User.findOne({ email });

    if (!user) {
      throw ApiError.notFound('User with this email does not exist.');
    }

    const otp = generateNumericOtp(6);
    user.setOtp(otp, otpReason, 10);
    await user.save({ validateBeforeSave: false });

    // Send email via SMTP
    sendOtpEmail({
      to: user.email,
      fullName: user.fullName,
      otp,
      reason: otpReason,
    }).catch(() => {});

    return {
      otp,
      message: `Fresh OTP has been generated for ${otpReason} and sent to ${user.email}.`,
    };
  }

  /**
   * Forget Password - triggers Password Reset OTP
   */
  static async forgetPassword(email: string) {
    const user = await User.findOne({ email });

    if (!user) {
      return {
        message: 'If this email is registered, an OTP has been sent for password reset.',
      };
    }

    const otp = generateNumericOtp(6);
    user.setOtp(otp, OTP_REASONS.PASSWORD_RESET, 10);
    await user.save({ validateBeforeSave: false });

    // Send password reset email via SMTP
    sendOtpEmail({
      to: user.email,
      fullName: user.fullName,
      otp,
      reason: OTP_REASONS.PASSWORD_RESET,
    }).catch(() => {});

    return {
      otp,
      message: 'Password reset OTP generated and sent to your email.',
    };
  }

  /**
   * Reset Password using OTP
   */
  static async resetPassword(data: { email: string; otp: string; newPassword: string }) {
    const user = await User.findOne({ email: data.email }).select('+otp +otpReason +otpExpiry');

    if (!user) {
      throw ApiError.notFound('No account found with this email address.');
    }

    if (!user.otp || !user.otpExpiry) {
      throw ApiError.badRequest('No active password reset request found. Please request an OTP.');
    }

    if (user.otpReason !== OTP_REASONS.PASSWORD_RESET) {
      throw ApiError.badRequest('OTP was not issued for password reset.');
    }

    if (isOtpExpired(user.otpExpiry)) {
      throw ApiError.badRequest('Password reset OTP has expired. Please request a new one.');
    }

    if (user.otp !== data.otp) {
      throw ApiError.badRequest('Invalid OTP. Please check and try again.');
    }

    user.password = data.newPassword;
    user.clearOtp();
    user.refreshToken = undefined;
    await user.save();

    return {
      message: 'Password has been reset successfully. Please log in with your new credentials.',
    };
  }

  /**
   * Social Login (Google, Facebook, Apple)
   */
  static async socialLogin(data: {
    socialType: 'google' | 'facebook' | 'apple';
    socialId: string;
    email: string;
    fullName: string;
    deviceType?: any;
    deviceToken?: string;
  }) {
    let user = await User.findOne({
      $or: [{ socialType: data.socialType, socialId: data.socialId }, { email: data.email }],
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        fullName: data.fullName,
        email: data.email,
        socialType: data.socialType,
        socialId: data.socialId,
        deviceType: data.deviceType || 'web',
        deviceToken: data.deviceToken,
        role: ROLES.USER,
        isAccountVerified: true,
      });
    } else {
      user.socialType = data.socialType;
      user.socialId = data.socialId;
      if (data.deviceType) user.deviceType = data.deviceType;
      if (data.deviceToken) user.deviceToken = data.deviceToken;
    }

    const tokens = generateAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user,
      tokens,
      isNewUser,
      message: isNewUser
        ? `Registered and logged in with ${data.socialType} successfully.`
        : `Logged in with ${data.socialType} successfully.`,
    };
  }

  /**
   * Change Password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.isPasswordMatch(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password provided is incorrect.');
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    return true;
  }

  /**
   * Refresh Token rotation
   */
  static async refreshToken(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required.');
    }

    const decoded = verifyJwt<{ sub: string; type: string }>(
      incomingRefreshToken,
      envConfig.JWT_REFRESH_SECRET
    );

    if (decoded.type !== TOKEN_TYPES.REFRESH) {
      throw ApiError.unauthorized('Invalid token type provided.');
    }

    const user = await User.findById(decoded.sub).select('+refreshToken +isActive');

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User session is invalid or user no longer exists.');
    }

    if (user.refreshToken && user.refreshToken !== incomingRefreshToken) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
      throw ApiError.unauthorized('Token reuse detected. Session invalidated for security.');
    }

    const tokens = generateAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, tokens };
  }

  /**
   * Logout
   */
  static async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    return true;
  }

  /**
   * Permanently delete user account
   */
  static async deleteAccount(userId: string, password?: string) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (password && user.password) {
      const isMatch = await user.isPasswordMatch(password);
      if (!isMatch) {
        throw ApiError.badRequest('Incorrect password provided for account deletion.');
      }
    }

    await User.findByIdAndDelete(userId);
    return true;
  }
}
