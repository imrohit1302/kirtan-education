import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { RaagService } from './raag.service.js';

export const createRaag = catchAsync(async (req: Request, res: Response) => {
  const raag = await RaagService.createRaag(req.body);
  return ApiResponse.created(res, 'Raag created successfully', { raag });
});

export const getAllRaags = catchAsync(async (req: Request, res: Response) => {
  const { raags, total } = await RaagService.getAllRaags(req.query as any);
  return ApiResponse.success(res, 'Raags retrieved successfully', { raags, total });
});

export const getRaagById = catchAsync(async (req: Request, res: Response) => {
  const raag = await RaagService.getRaagById(req.params.id as string);
  return ApiResponse.success(res, 'Raag retrieved successfully', { raag });
});

export const updateRaag = catchAsync(async (req: Request, res: Response) => {
  const raag = await RaagService.updateRaag(req.params.id as string, req.body);
  return ApiResponse.success(res, 'Raag updated successfully', { raag });
});

export const deleteRaag = catchAsync(async (req: Request, res: Response) => {
  await RaagService.deleteRaag(req.params.id as string);
  return ApiResponse.success(res, 'Raag deleted successfully');
});

