// Storage Service coordinating S3 and R2 providers with project isolation
import crypto from 'crypto';
import path from 'path';
import { configManager } from '../../config/config.manager';
import { IFileMetadata, IStorageProvider } from '../providers/storage-provider.interface';
import { S3StorageProvider } from '../providers/s3.provider';
import { R2StorageProvider } from '../providers/r2.provider';
import {
  FileSizeExceededError,
  InvalidFileTypeError,
  StorageError,
} from '../../errors/storage.errors';

export interface IUploadFileInput {
  buffer: Buffer;
  mimeType: string;
  originalname: string;
}

export interface IFileValidationOptions {
  allowedMimeTypes?: string[];
  maxSizeBytes?: number; // default: 10MB
}

export class StorageService {
  private provider: IStorageProvider | null = null;

  public getProvider(): IStorageProvider {
    if (this.provider) return this.provider;

    const storageConfig = configManager.getStorage();
    if (!storageConfig) {
      throw new StorageError('Storage is not configured for this backend instance');
    }

    if (storageConfig.provider === 's3') {
      this.provider = new S3StorageProvider(storageConfig);
    } else if (storageConfig.provider === 'r2') {
      this.provider = new R2StorageProvider(storageConfig);
    } else {
      throw new StorageError(
        `Unsupported storage provider: ${(storageConfig as { provider?: string }).provider}`,
      );
    }

    return this.provider;
  }

  public setMockProvider(mock: IStorageProvider | null): void {
    this.provider = mock;
  }

  public validateFile(file: IUploadFileInput, options: IFileValidationOptions = {}): void {
    const maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10 MB

    if (file.buffer.length > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      throw new FileSizeExceededError(`File size exceeds maximum allowed size of ${maxMb}MB`);
    }

    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(file.mimeType.toLowerCase())) {
        throw new InvalidFileTypeError(
          `Invalid file type "${file.mimeType}". Allowed: ${options.allowedMimeTypes.join(', ')}`,
        );
      }
    }
  }

  public buildStorageKey(projectSlug: string, module: string, originalname: string): string {
    const ext = path.extname(originalname);
    const sanitizedBase = path
      .basename(originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50);

    const randomSuffix = crypto.randomUUID().slice(0, 8);
    return `${projectSlug}/${module}/${Date.now()}-${randomSuffix}-${sanitizedBase}${ext}`;
  }

  public async upload(
    projectSlug: string,
    module: string,
    file: IUploadFileInput,
    options?: IFileValidationOptions,
  ): Promise<{ key: string; url: string }> {
    this.validateFile(file, options);

    const key = this.buildStorageKey(projectSlug, module, file.originalname);
    const provider = this.getProvider();
    const url = await provider.uploadFile(key, file.buffer, file.mimeType);

    return { key, url };
  }

  public async delete(key: string): Promise<void> {
    const provider = this.getProvider();
    await provider.deleteFile(key);
  }

  public async deleteMany(keys: string[]): Promise<void> {
    const provider = this.getProvider();
    await provider.deleteFiles(keys);
  }

  public async getUrl(
    key: string,
    expiresInSeconds: number = 3600,
    filename?: string,
  ): Promise<string> {
    const provider = this.getProvider();
    return provider.getFileUrl(key, expiresInSeconds, filename);
  }

  public async exists(key: string): Promise<boolean> {
    const provider = this.getProvider();
    return provider.fileExists(key);
  }

  public async getMetadata(key: string): Promise<IFileMetadata> {
    const provider = this.getProvider();
    return provider.getFileMetadata(key);
  }
}

export const storageService = new StorageService();
