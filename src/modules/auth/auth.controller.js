import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { clearAuthCookies, setAuthCookies } from '../../utils/token.util.js';
import { AuthService } from './auth.service.js';

export const register = catchAsync(async (req, res) => {
  const { user, tokens } = await AuthService.register(req.body);
  setAuthCookies(res, tokens);
  return ApiResponse.created(res, 'User registered successfully', { user, tokens });
});

export const login = catchAsync(async (req, res) => {
  const { user, tokens } = await AuthService.login(req.body);
  setAuthCookies(res, tokens);
  return ApiResponse.success(res, 'Authentication successful', { user, tokens });
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, tokens } = await AuthService.refreshToken(token);
  setAuthCookies(res, tokens);
  return ApiResponse.success(res, 'Tokens refreshed successfully', { user, tokens });
});

export const logout = catchAsync(async (req, res) => {
  if (req.user?._id) {
    await AuthService.logout(req.user._id);
  }
  clearAuthCookies(res);
  return ApiResponse.success(res, 'Logged out successfully');
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await AuthService.changePassword(req.user._id, currentPassword, newPassword);
  clearAuthCookies(res);
  return ApiResponse.success(
    res,
    'Password changed successfully. Please log in again with your new credentials.'
  );
});

export const forgotPassword = catchAsync(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);
  return ApiResponse.success(res, result.message, result);
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  await AuthService.resetPassword(token, password);
  return ApiResponse.success(
    res,
    'Password has been reset successfully. You can now log in with your new password.'
  );
});

export const getMe = catchAsync(async (req, res) => {
  return ApiResponse.success(res, 'Current user profile fetched successfully', {
    user: req.user,
  });
});
