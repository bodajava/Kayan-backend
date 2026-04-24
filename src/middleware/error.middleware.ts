import type { NextFunction, Request, Response } from 'express';
import { configService } from '../common/services/config.service.js';

interface IError extends Error {
  statusCode?: number;
  cause?: any;
  stack?: string;
  errors?: any; // For Zod/Mongoose multiple errors
}

export const globalErrorHandler = (error: IError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let errors = error.errors || null;

  // Handle specific error types
  if (error.name === 'ValidationError') { // Mongoose Validation Error
    statusCode = 400;
  } else if (error.name === 'CastError') { // Mongoose Cast Error (Invalid ID)
    statusCode = 400;
    message = 'Invalid Resource ID';
  } else if (error.name === 'ZodError') { // Zod Validation Error (if thrown directly)
    statusCode = 400;
    message = 'Validation Failed';
  }

  const isProd = configService.isProd;

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(errors && { errors }),
    ...(!isProd && { 
      cause: error.cause, 
      stack: error.stack,
      error: error
    }),
  });
};