import { envConfig } from '../../config/env.config.js';
import { TOKEN_TYPES } from '../../constants/roles.js';
import { ApiError } from '../../utils/apiError.js';
import { hashSha256 } from '../../utils/password.util.js';
import { generateAuthTokens, verifyJwt } from '../../utils/token.util.js';
import { User } from '../user/user.model.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register({ name, email, password, role }) {
    const isTaken = await User.isEmailTaken(email);
    if (isTaken) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    const user = await User.create({
      name,
      email,
      password,
      ...(role ? { role } : {}),
    });

    const tokens = generateAuthTokens(user);

    // Save refresh token reference for revocation tracking
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, tokens };
  }

  /**
   * Authenticate user with email and password
   */
  static async login({ email, password }) {
    const user = await User.findOne({ email }).select(
      '+password +isActive +loginAttempts +lockUntil'
    );

    if (!user) {
      // Use identical error message to prevent account enumeration
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated. Please contact support.');
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw ApiError.forbidden(
        `Account temporarily locked due to consecutive failed attempts. Try again in ${waitMinutes} minute(s).`
      );
    }

    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
      // Increment failed attempts and lock if threshold reached
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.save({ validateBeforeSave: false });
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    // Reset login attempts on successful authentication
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    const tokens = generateAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, tokens };
  }

  /**
   * Issue fresh access token using valid refresh token (Refresh Token Rotation)
   */
  static async refreshToken(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required.');
    }

    // Verify token cryptographic signature
    const decoded = verifyJwt(incomingRefreshToken, envConfig.JWT_REFRESH_SECRET);

    if (decoded.type !== TOKEN_TYPES.REFRESH) {
      throw ApiError.unauthorized('Invalid token type provided.');
    }

    const user = await User.findById(decoded.sub).select('+refreshToken +isActive');

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User session is invalid or user no longer exists.');
    }

    // Refresh token reuse detection (security best practice)
    if (user.refreshToken && user.refreshToken !== incomingRefreshToken) {
      // Invalidate existing sessions if a revoked token is replayed
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
      throw ApiError.unauthorized('Token reuse detected. Session invalidated for security.');
    }

    // Rotate tokens
    const tokens = generateAuthTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user, tokens };
  }

  /**
   * Terminate active user session
   */
  static async logout(userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    return true;
  }

  /**
   * Change user password securely
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.isPasswordMatch(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password provided is incorrect.');
    }

    user.password = newPassword;
    user.refreshToken = undefined; // Invalidate all active refresh sessions
    await user.save();

    return true;
  }

  /**
   * Generate password reset token
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email });

    // Prevent email enumeration: return success even if user not found
    if (!user) {
      return { message: 'If that email is registered, a password reset token was generated.' };
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    return {
      message: 'Password reset token generated successfully.',
      resetToken, // In production, this is emailed. Provided in API response for direct testing.
    };
  }

  /**
   * Reset password with reset token
   */
  static async resetPassword(token, newPassword) {
    const hashedToken = hashSha256(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired.');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    return true;
  }
}
