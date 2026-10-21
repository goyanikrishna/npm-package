// Base error definition for @node-backend-toolkit

export class ToolkitError extends Error {
  public status: number;
  public errorCode?: string;
  public errors?: unknown;

  constructor(
    status: number = 500,
    message: string = 'An error occurred',
    errorCode?: string,
    errors?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Alias for reference project compatibility
export const ErrorHandler = ToolkitError;
export type ErrorHandler = ToolkitError;

export class BadRequestException extends ToolkitError {
  constructor(message: string = 'Validation error', errors?: unknown) {
    super(400, message, 'BAD_REQUEST', errors);
  }
}

export class ServerException extends ToolkitError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
  }
}
