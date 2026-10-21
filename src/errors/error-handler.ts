// Error handler middleware and response formatter
import { NextFunction, Request, Response } from 'express';
import { ToolkitError } from './base.error';

export interface IFormattedErrorResponse {
  success: false;
  status: number;
  message: string;
  error_code?: string;
  errors?: unknown;
  data: null;
}

export const formatErrorResponse = (err: unknown): IFormattedErrorResponse => {
  let status = 500;
  let message = 'Internal server error';
  let errorCode: string | undefined = undefined;
  let errors: unknown = undefined;

  if (err instanceof ToolkitError) {
    status = err.status;
    message = err.message;
    errorCode = err.errorCode;
    errors = err.errors;
  } else if (err && typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;

    // Handle express-validation ValidationError
    if ('statusCode' in errorObj && typeof errorObj.statusCode === 'number') {
      status = errorObj.statusCode;
      message = (errorObj.message as string) || 'Validation error';
      errorCode = 'VALIDATION_ERROR';
      errors = errorObj.details;
    }
    // Handle Joi ValidationError
    else if ('isJoi' in errorObj || ('name' in errorObj && errorObj.name === 'ValidationError')) {
      status = 400;
      message = (errorObj.message as string) || 'Validation error';
      errorCode = 'VALIDATION_ERROR';
      errors = errorObj.details;
    }
    // Handle TypeORM EntityNotFoundError
    else if (errorObj.name === 'EntityNotFoundError') {
      status = 404;
      message = 'Requested record not found';
      errorCode = 'NOT_FOUND';
    }
    // Handle TypeORM QueryFailedError (Postgres error codes)
    else if (errorObj.name === 'QueryFailedError') {
      const pgCode =
        (errorObj.code as string) ||
        ((errorObj.driverError as Record<string, unknown>)?.code as string);

      if (pgCode === '23505') {
        // Unique violation
        status = 409;
        message = 'A record with these details already exists';
        errorCode = 'UNIQUE_VIOLATION';
      } else if (pgCode === '23503') {
        // Foreign key violation
        status = 422;
        message = 'Referenced record does not exist';
        errorCode = 'FOREIGN_KEY_VIOLATION';
      } else if (pgCode === '22P02') {
        // Invalid input syntax (e.g. invalid UUID)
        status = 400;
        message = 'Invalid input format';
        errorCode = 'INVALID_INPUT_SYNTAX';
      } else {
        status = 500;
        message = 'Database operation failed';
        errorCode = 'DATABASE_ERROR';
      }
    }
    // Handle standard Error
    else if (err instanceof Error) {
      message = err.message;
    }
  }

  const response: IFormattedErrorResponse = {
    success: false,
    status,
    message,
    data: null,
  };

  if (errorCode) {
    response.error_code = errorCode;
  }
  if (errors !== undefined) {
    response.errors = errors;
  }

  return response;
};

// Express error handling middleware
export const errorHandlerMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  const formatted = formatErrorResponse(err);
  return res.status(formatted.status).json(formatted);
};

// Direct response helper
export const handleError = (err: unknown, res: Response): Response => {
  const formatted = formatErrorResponse(err);
  return res.status(formatted.status).json(formatted);
};
