// Cloudflare R2 Storage Provider
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
import { IR2StorageConfig } from '../../config/types';
import { StorageError } from '../../errors/storage.errors';

export class R2StorageProvider implements IStorageProvider {
  public readonly name = 'r2';
  private client: S3Client;
  private bucket: string;
  private public_url?: string;

  constructor(config: IR2StorageConfig) {
    this.bucket = config.bucket;
    this.public_url = config.public_url;

    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: `https://${config.account_id}.r2.cloudflarestorage.com`,
      credentials: {
        access_key_id: config.access_key_id,
        secret_access_key: config.secret_access_key,
      },
    });
  }

  private cleanKey(key: string): string {
    if (!key) return '';
    if (this.public_url && key.startsWith(this.public_url)) {
      return key.replace(`${this.public_url.replace(/\/$/, '')}/`, '');
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
        content_type: mimeType,
      });

      await this.client.send(command);

      if (this.public_url) {
        return `${this.public_url.replace(/\/$/, '')}/${cleanKey}`;
      }
      return cleanKey;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown R2 error';
      throw new StorageError(`Failed to upload file to R2: ${msg}`);
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
      const msg = err instanceof Error ? err.message : 'Unknown R2 error';
      throw new StorageError(`Failed to delete file from R2: ${msg}`);
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
      const msg = err instanceof Error ? err.message : 'Unknown R2 error';
      throw new StorageError(`Failed to delete files from R2: ${msg}`);
    }
  }

  public async getFileUrl(
    key: string,
    expiresInSeconds: number = 3600,
    filename?: string,
  ): Promise<string> {
    const cleanKey = this.cleanKey(key);
    if (!cleanKey) return '';

    if (this.public_url) {
      return `${this.public_url.replace(/\/$/, '')}/${cleanKey}`;
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
      const msg = err instanceof Error ? err.message : 'Unknown R2 error';
      throw new StorageError(`Failed to generate signed URL from R2: ${msg}`);
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
        content_length: res.content_length ?? 0,
        content_type: res.content_type ?? 'application/octet-stream',
        etag: res.ETag,
        last_modified: res.last_modified,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown R2 error';
      throw new StorageError(`Failed to fetch file metadata from R2: ${msg}`);
    }
  }
}
