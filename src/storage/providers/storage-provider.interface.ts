// Storage Provider Interface
export interface IFileMetadata {
  content_length: number;
  content_type: string;
  etag?: string;
  last_modified?: Date;
}

export interface IStorageProvider {
  readonly name: string;
  uploadFile(key: string, body: Buffer | Uint8Array | string, mimeType: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  deleteFiles(keys: string[]): Promise<void>;
  getFileUrl(key: string, expiresInSeconds?: number, filename?: string): Promise<string>;
  fileExists(key: string): Promise<boolean>;
  getFileMetadata(key: string): Promise<IFileMetadata>;
}
