import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { RoleService } from './role.service.js';

export const createRole = catchAsync(async (req: Request, res: Response) => {
  const role = await RoleService.createRole(req.body);
  return ApiResponse.created(res, 'Role created successfully', { role });
});

export const getAllRoles = catchAsync(async (req: Request, res: Response) => {
  const { roles, total } = await RoleService.getAllRoles(req.query as any);
  return ApiResponse.success(res, 'Roles retrieved successfully', { roles, total });
});

export const getRoleById = catchAsync(async (req: Request, res: Response) => {
  const role = await RoleService.getRoleById(req.params.id as string);
  return ApiResponse.success(res, 'Role retrieved successfully', { role });
});

export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const role = await RoleService.updateRole(req.params.id as string, req.body);
  return ApiResponse.success(res, 'Role updated successfully', { role });
});

export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  await RoleService.deleteRole(req.params.id as string);
  return ApiResponse.success(res, 'Role deleted successfully');
});

