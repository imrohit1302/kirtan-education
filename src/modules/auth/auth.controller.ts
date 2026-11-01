import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { clearAuthCookies, setAuthCookies } from '../../utils/token.util.js';
import { AuthService } from './auth.service.js';

export const signUp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signUp(req.body);
  setAuthCookies(res, result.tokens);
  return ApiResponse.created(res, result.message, result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  setAuthCookies(res, result.tokens);
  return ApiResponse.success(res, result.message, result);
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyOtp(req.body);
  if ((result as any).tokens) {
    setAuthCookies(res, (result as any).tokens);
  }
  return ApiResponse.success(res, result.message, result);
});

export const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otpReason } = req.body;
  const result = await AuthService.resendOtp(email, otpReason);
  return ApiResponse.success(res, result.message, result);
});

export const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgetPassword(req.body.email);
  return ApiResponse.success(res, result.message, result);
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body);
  return ApiResponse.success(res, result.message, result);
});

export const socialLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.socialLogin(req.body);
  setAuthCookies(res, result.tokens);
  return ApiResponse.success(res, result.message, result);
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await AuthService.changePassword(req.user!._id.toString(), currentPassword, newPassword);
  clearAuthCookies(res);
  return ApiResponse.success(
    res,
    'Password changed successfully. Please log in again with your new password.'
  );
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, tokens } = await AuthService.refreshToken(token);
  setAuthCookies(res, tokens);
  return ApiResponse.success(res, 'Tokens refreshed successfully', { user, tokens });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  if (req.user?._id) {
    await AuthService.logout(req.user._id.toString());
  }
  clearAuthCookies(res);
  return ApiResponse.success(res, 'Logged out successfully');
});
