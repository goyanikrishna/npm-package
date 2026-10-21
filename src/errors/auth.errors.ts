import { ToolkitError } from './base.error';

export class AuthException extends ToolkitError {
  constructor(message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED') {
    super(401, message, errorCode);
  }
}

export const AuthError = AuthException;
export type AuthError = AuthException;

export class InvalidTokenError extends ToolkitError {
  constructor(message: string = 'Invalid token') {
    super(401, message, 'INVALID_TOKEN');
  }
}

export class TokenExpiredError extends ToolkitError {
  constructor(message: string = 'Token has expired') {
    super(401, message, 'TOKEN_EXPIRED');
  }
}

export const ExpiredException = TokenExpiredError;
export type ExpiredException = TokenExpiredError;

export class InvalidCredentialsError extends ToolkitError {
  constructor(message: string = 'Invalid email or password') {
    super(401, message, 'INVALID_CREDENTIALS');
  }
}

export class NotMatchException extends ToolkitError {
  constructor(message: string = 'Provided data does not match') {
    super(422, message, 'NOT_MATCH');
  }
}

export class SessionRevokedError extends ToolkitError {
  constructor(message: string = 'Session has been revoked') {
    super(401, message, 'SESSION_REVOKED');
  }
}
