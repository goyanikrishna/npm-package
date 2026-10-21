import { ToolkitError } from './base.error';

export class UserNotFoundError extends ToolkitError {
  constructor(message: string = 'User not found') {
    super(404, message, 'USER_NOT_FOUND');
  }
}

export const NotFoundException = UserNotFoundError;
export type NotFoundException = UserNotFoundError;

export class UserInactiveError extends ToolkitError {
  constructor(message: string = 'User account is inactive or suspended') {
    super(403, message, 'USER_INACTIVE');
  }
}

export class DuplicateEmailError extends ToolkitError {
  constructor(message: string = 'User with this email already exists in this project') {
    super(409, message, 'DUPLICATE_EMAIL');
  }
}

export const ExistException = DuplicateEmailError;
export type ExistException = DuplicateEmailError;

export class SuperAdminProtectedError extends ToolkitError {
  constructor(message: string = 'Operation forbidden on Super Admin account') {
    super(403, message, 'SUPER_ADMIN_PROTECTED');
  }
}

export class SelfDemotionError extends ToolkitError {
  constructor(message: string = 'Super Admin cannot revoke own Super Admin role') {
    super(403, message, 'SELF_DEMOTION_FORBIDDEN');
  }
}
