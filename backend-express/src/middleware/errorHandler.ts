import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  stack?: string;
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error caught by handler:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });

  const response: ErrorResponse = {
    status: 'error',
    statusCode: 500,
    message: 'Internal server error',
  };

  if (error instanceof AppError) {
    response.statusCode = error.statusCode;
    response.message = error.message;
  }

  if (error instanceof ZodError) {
    response.statusCode = 400;
    response.message = 'Validation error';
    response.errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    response.statusCode = 400;
    response.message = 'Database operation failed';
  }

  if (error.name === 'PrismaClientValidationError') {
    response.statusCode = 400;
    response.message = 'Invalid data provided';
  }

  if (config.server.isDev) {
    response.stack = error.stack;
  }

  res.status(response.statusCode).json(response);
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route ${req.method} ${req.path} not found`));
}
