import { ToolkitError } from './base.error';

export class ProjectNotFoundError extends ToolkitError {
  constructor(message: string = 'Project not found') {
    super(404, message, 'PROJECT_NOT_FOUND');
  }
}

export class ProjectMismatchError extends ToolkitError {
  constructor(message: string = 'Resource does not belong to the requested project') {
    super(403, message, 'PROJECT_MISMATCH');
  }
}

export class DuplicateProjectError extends ToolkitError {
  constructor(message: string = 'Project with this name or slug already exists') {
    super(409, message, 'DUPLICATE_PROJECT');
  }
}
