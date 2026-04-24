import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async express middleware/controller to catch errors and pass them to the next error handler.
 * This eliminates the need for try/catch blocks in every route.
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
