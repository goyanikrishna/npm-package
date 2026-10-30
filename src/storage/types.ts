// Storage Module Type Definitions
export interface IUploadFileInput {
  buffer: Buffer;
  mimeType: string;
  originalname: string;
}

export interface IFileValidationOptions {
  allowed_mime_types?: string[];
  max_size_bytes?: number; // default: 10MB
}

