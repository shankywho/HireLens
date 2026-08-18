import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Global Error Handling Middleware
 * Intercepts both operational domain errors and unhandled runtime exceptions,
 * outputting structured logs and standard JSON error response envelopes.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error(`[OPERATIONAL 5XX ERROR] ${err.errorCode}: ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        details: err.details,
        stack: err.stack,
      });
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unhandled Programmer / System Error
  console.error('[UNHANDLED SERVER EXCEPTION]', {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
  });
}

/**
 * Wraps async Express controller handlers to automatically catch and forward errors to next()
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
