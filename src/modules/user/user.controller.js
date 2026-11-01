import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { UserService } from './user.service.js';

export const getProfile = catchAsync(async (req, res) => {
  const user = await UserService.getProfile(req.user._id);
  return ApiResponse.success(res, 'Profile retrieved successfully', { user });
});

export const updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await UserService.updateProfile(req.user._id, req.body);
  return ApiResponse.success(res, 'Profile updated successfully', { user: updatedUser });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const { users, pagination } = await UserService.getAllUsers(req.query);
  return ApiResponse.success(res, 'Users fetched successfully', { users }, 200, { pagination });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  return ApiResponse.success(res, 'User fetched successfully', { user });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const user = await UserService.updateUserRole(req.params.id, req.body.role);
  return ApiResponse.success(res, 'User role updated successfully', { user });
});

export const deleteUser = catchAsync(async (req, res) => {
  await UserService.deleteUser(req.params.id);
  return ApiResponse.success(res, 'User deleted successfully');
});
