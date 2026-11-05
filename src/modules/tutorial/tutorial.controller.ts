import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { TutorialService } from './tutorial.service.js';

export const createTutorial = catchAsync(async (req: Request, res: Response) => {
  const tutorial = await TutorialService.createTutorial(req.body);
  return ApiResponse.created(res, 'Tutorial created successfully', { tutorial });
});

/**
 * GET /api/v1/tutorials
 * Returns all tutorials with isBookmarked flag based on the authenticated user.
 */
export const getAllTutorials = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id?.toString();
  const { tutorials, total } = await TutorialService.getAllTutorials(req.query as any, userId);
  return ApiResponse.success(res, 'Tutorials retrieved successfully', { tutorials, total });
});

/**
 * GET /api/v1/tutorials/:id
 * Returns a single tutorial with isBookmarked flag based on the authenticated user.
 */
export const getTutorialById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id?.toString();
  const tutorial = await TutorialService.getTutorialById(req.params.id as string, userId);
  return ApiResponse.success(res, 'Tutorial retrieved successfully', { tutorial });
});

export const updateTutorial = catchAsync(async (req: Request, res: Response) => {
  const tutorial = await TutorialService.updateTutorial(req.params.id as string, req.body);
  return ApiResponse.success(res, 'Tutorial updated successfully', { tutorial });
});

export const deleteTutorial = catchAsync(async (req: Request, res: Response) => {
  await TutorialService.deleteTutorial(req.params.id as string);
  return ApiResponse.success(res, 'Tutorial deleted successfully');
});
