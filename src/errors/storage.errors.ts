import { ToolkitError } from './base.error';

export class StorageError extends ToolkitError {
  constructor(message: string = 'Storage operation failed', errorCode: string = 'STORAGE_ERROR') {
    super(500, message, errorCode);
  }
}

export class FileNotFoundError extends ToolkitError {
  constructor(message: string = 'File not found') {
    super(404, message, 'FILE_NOT_FOUND');
  }
}

export class InvalidFileTypeError extends ToolkitError {
  constructor(message: string = 'Invalid file type') {
    super(400, message, 'INVALID_FILE_TYPE');
  }
}

export class FileSizeExceededError extends ToolkitError {
  constructor(message: string = 'File size exceeds allowed limit') {
    super(400, message, 'FILE_SIZE_EXCEEDED');
  }
}
