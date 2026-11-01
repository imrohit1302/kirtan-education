import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { UserService } from './user.service.js';

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getProfile(req.user!._id.toString());
  return ApiResponse.success(res, 'User profile retrieved successfully', { user });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const updatedUser = await UserService.updateProfile(req.user!._id.toString(), req.body);
  return ApiResponse.success(res, 'Profile updated successfully', { user: updatedUser });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { users, pagination } = await UserService.getAllUsers(req.query as any);
  return ApiResponse.success(res, 'Users fetched successfully', { users }, 200, { pagination });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(req.params.id as string);
  return ApiResponse.success(res, 'User fetched successfully', { user });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.updateUserRole(req.params.id as string, req.body.role);
  return ApiResponse.success(res, 'User role updated successfully', { user });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await UserService.deleteUser(req.params.id as string);
  return ApiResponse.success(res, 'User deleted successfully');
});
