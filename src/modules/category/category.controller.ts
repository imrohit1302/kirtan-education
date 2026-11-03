import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { CategoryService } from './category.service.js';

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.createCategory(req.body);
  return ApiResponse.created(res, 'Category created successfully', { category });
});

export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const { categories, total } = await CategoryService.getAllCategories(req.query as any);
  return ApiResponse.success(res, 'Categories retrieved successfully', { categories, total });
});

export const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.getCategoryById(req.params.id as string);
  return ApiResponse.success(res, 'Category retrieved successfully', { category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.updateCategory(req.params.id as string, req.body);
  return ApiResponse.success(res, 'Category updated successfully', { category });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await CategoryService.deleteCategory(req.params.id as string);
  return ApiResponse.success(res, 'Category deleted successfully');
});

