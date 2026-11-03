import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { BookService } from './book.service.js';

export const createBook = catchAsync(async (req: Request, res: Response) => {
  const book = await BookService.createBook(req.body);
  return ApiResponse.created(res, 'Book created successfully', { book });
});

export const getAllBooks = catchAsync(async (req: Request, res: Response) => {
  const { books, total } = await BookService.getAllBooks(req.query as any);
  return ApiResponse.success(res, 'Books retrieved successfully', { books, total });
});

export const getBookById = catchAsync(async (req: Request, res: Response) => {
  const book = await BookService.getBookById(req.params.id as string);
  return ApiResponse.success(res, 'Book retrieved successfully', { book });
});

export const updateBook = catchAsync(async (req: Request, res: Response) => {
  const book = await BookService.updateBook(req.params.id as string, req.body);
  return ApiResponse.success(res, 'Book updated successfully', { book });
});

export const deleteBook = catchAsync(async (req: Request, res: Response) => {
  await BookService.deleteBook(req.params.id as string);
  return ApiResponse.success(res, 'Book deleted successfully');
});

