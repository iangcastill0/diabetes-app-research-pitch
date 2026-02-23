import { Request, Response, NextFunction } from 'express';
import { logger } from '../index';
import { ApiResponse, ApiError } from '@bb/shared-types';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  
  const errorResponse: ApiResponse<null> = {
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // Log error
  if (statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Server error');
  } else {
    logger.warn({ err, req: { method: req.method, url: req.url } }, 'Client error');
  }

  res.status(statusCode).json(errorResponse);
};
