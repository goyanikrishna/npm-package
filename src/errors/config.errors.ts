import { ToolkitError } from './base.error';

export class ConfigurationError extends ToolkitError {
  constructor(message: string = 'Invalid configuration') {
    super(500, message, 'CONFIGURATION_ERROR');
  }
}

export class DynamicFieldValidationError extends ToolkitError {
  constructor(message: string, errors?: unknown) {
    super(400, message, 'DYNAMIC_FIELD_VALIDATION_ERROR', errors);
  }
}

export class RateLimitExceededError extends ToolkitError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
  }
}
