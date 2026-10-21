// AWS S3 Storage Provider
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IFileMetadata, IStorageProvider } from './storage-provider.interface';
import { IS3StorageConfig } from '../../config/types';
import { StorageError } from '../../errors/storage.errors';

export class S3StorageProvider implements IStorageProvider {
  public readonly name = 's3';
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: IS3StorageConfig) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    this.client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private cleanKey(key: string): string {
    if (!key) return '';
    if (this.publicUrl && key.startsWith(this.publicUrl)) {
      return key.replace(`${this.publicUrl.replace(/\/$/, '')}/`, '');
    }
    return key.replace(/^\/+/, '');
  }

  public async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    mimeType: string,
  ): Promise<string> {
    const cleanKey = this.cleanKey(key);
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
        Body: body,
        ContentType: mimeType,
      });

      await this.client.send(command);

      if (this.publicUrl) {
        return `${this.publicUrl.replace(/\/$/, '')}/${cleanKey}`;
      }
      return cleanKey;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown S3 error';
      throw new StorageError(`Failed to upload file to S3: ${msg}`);
    }
  }

  public async deleteFile(key: string): Promise<void> {
    const cleanKey = this.cleanKey(key);
    if (!cleanKey) return;
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown S3 error';
      throw new StorageError(`Failed to delete file from S3: ${msg}`);
    }
  }

  public async deleteFiles(keys: string[]): Promise<void> {
    const validKeys = keys.map((k) => this.cleanKey(k)).filter(Boolean);
    if (validKeys.length === 0) return;
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: validKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      });
      await this.client.send(command);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown S3 error';
      throw new StorageError(`Failed to delete files from S3: ${msg}`);
    }
  }

  public async getFileUrl(
    key: string,
    expiresInSeconds: number = 3600,
    filename?: string,
  ): Promise<string> {
    const cleanKey = this.cleanKey(key);
    if (!cleanKey) return '';

    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${cleanKey}`;
    }

    try {
      const contentDisposition = filename
        ? `inline; filename="${encodeURIComponent(filename)}"`
        : undefined;

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
        ResponseContentDisposition: contentDisposition,
      });

      return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown S3 error';
      throw new StorageError(`Failed to generate signed URL from S3: ${msg}`);
    }
  }

  public async fileExists(key: string): Promise<boolean> {
    const cleanKey = this.cleanKey(key);
    if (!cleanKey) return false;
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  public async getFileMetadata(key: string): Promise<IFileMetadata> {
    const cleanKey = this.cleanKey(key);
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      const res = await this.client.send(command);

      return {
        contentLength: res.ContentLength ?? 0,
        contentType: res.ContentType ?? 'application/octet-stream',
        etag: res.ETag,
        lastModified: res.LastModified,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown S3 error';
      throw new StorageError(`Failed to fetch file metadata from S3: ${msg}`);
    }
  }
}
