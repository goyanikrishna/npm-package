// Storage Service coordinating S3 and R2 providers with project isolation
import { configManager } from '../../config/config.manager';
import {
  FileSizeExceededError,
  InvalidFileTypeError,
  StorageError,
} from '../../errors/storage.errors';
import { R2StorageProvider } from '../providers/r2.provider';
import { S3StorageProvider } from '../providers/s3.provider';
import { IFileMetadata, IStorageProvider } from '../providers/storage-provider.interface';
import { IFileValidationOptions, IUploadFileInput } from '../types';
import crypto from 'crypto';
import path from 'path';

export { IUploadFileInput, IFileValidationOptions };

let activeStorageProvider: IStorageProvider | null = null;

const getStorageProvider = (): IStorageProvider => {
  if (activeStorageProvider) return activeStorageProvider;

  const storageConfig = configManager.getStorage();
  if (!storageConfig) {
    throw new StorageError('Storage is not configured for this backend instance');
  }

  if (storageConfig.provider === 's3') {
    activeStorageProvider = new S3StorageProvider(storageConfig);
  } else if (storageConfig.provider === 'r2') {
    activeStorageProvider = new R2StorageProvider(storageConfig);
  } else {
    throw new StorageError(
      `Unsupported storage provider: ${(storageConfig as { provider?: string }).provider}`,
    );
  }

  return activeStorageProvider;
};

const setMockStorageProvider = (mock: IStorageProvider | null): void => {
  activeStorageProvider = mock;
};

const validateStorageFile = (
  file: IUploadFileInput,
  options: IFileValidationOptions = {},
): void => {
  const max_size_bytes = options.max_size_bytes || 10 * 1024 * 1024; // 10 MB

  if (file.buffer.length > max_size_bytes) {
    const maxMb = Math.round(max_size_bytes / (1024 * 1024));
    throw new FileSizeExceededError(`File size exceeds maximum allowed size of ${maxMb}MB`);
  }

  if (options.allowed_mime_types && options.allowed_mime_types.length > 0) {
    if (!options.allowed_mime_types.includes(file.mimeType.toLowerCase())) {
      throw new InvalidFileTypeError(
        `Invalid file type "${file.mimeType}". Allowed: ${options.allowed_mime_types.join(', ')}`,
      );
    }
  }
};

const buildStorageKey = (
  projectSlug: string,
  module: string,
  originalname: string,
): string => {
  const safeProjectSlug = projectSlug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  const safeModule = module.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  const ext = path.extname(originalname).replace(/[^a-zA-Z0-9.]/g, '');
  const sanitizedBase = path
    .basename(originalname, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 50);

  const randomSuffix = crypto.randomUUID().slice(0, 8);
  return `${safeProjectSlug}/${safeModule}/${Date.now()}-${randomSuffix}-${sanitizedBase}${ext}`;
};

const uploadFile = async (
  projectSlug: string,
  module: string,
  file: IUploadFileInput,
  options?: IFileValidationOptions,
): Promise<{ key: string; url: string }> => {
  validateStorageFile(file, options);

  const key = buildStorageKey(projectSlug, module, file.originalname);
  const provider = getStorageProvider();
  const url = await provider.uploadFile(key, file.buffer, file.mimeType);

  return { key, url };
};

const deleteStorageFile = async (key: string): Promise<void> => {
  const provider = getStorageProvider();
  await provider.deleteFile(key);
};

const deleteManyStorageFiles = async (keys: string[]): Promise<void> => {
  const provider = getStorageProvider();
  await provider.deleteFiles(keys);
};

const getStorageFileUrl = async (
  key: string,
  expiresInSeconds: number = 3600,
  filename?: string,
): Promise<string> => {
  const provider = getStorageProvider();
  return provider.getFileUrl(key, expiresInSeconds, filename);
};

const storageFileExists = async (key: string): Promise<boolean> => {
  const provider = getStorageProvider();
  return provider.fileExists(key);
};

const getStorageFileMetadata = async (key: string): Promise<IFileMetadata> => {
  const provider = getStorageProvider();
  return provider.getFileMetadata(key);
};

export const storageService = {
  getProvider: getStorageProvider,
  setMockProvider: setMockStorageProvider,
  validateFile: validateStorageFile,
  buildStorageKey,
  upload: uploadFile,
  delete: deleteStorageFile,
  deleteMany: deleteManyStorageFiles,
  getUrl: getStorageFileUrl,
  exists: storageFileExists,
  getMetadata: getStorageFileMetadata,
};
