// Storage Service Unit Tests
import { storageService } from '../../src/storage/services/storage.service';
import { IStorageProvider } from '../../src/storage/providers/storage-provider.interface';
import { FileSizeExceededError, InvalidFileTypeError } from '../../src/errors/storage.errors';

describe('Storage Service', () => {
  describe('Path Generator', () => {
    it('should generate project-scoped and sanitized storage keys', () => {
      const key = storageService.buildStorageKey(
        'project-alpha',
        'avatars',
        'My Profile Picture (1).png',
      );

      expect(key.startsWith('project-alpha/avatars/')).toBe(true);
      expect(key.endsWith('.png')).toBe(true);
      expect(key).not.toContain('(');
      expect(key).not.toContain(')');
      expect(key).not.toContain(' ');
    });

    it('should sanitize path traversal attempts in projectSlug and module', () => {
      const key = storageService.buildStorageKey(
        '../../evil-tenant',
        '../system/root',
        '../../../passwd.txt',
      );

      expect(key).not.toContain('..');
      expect(key.startsWith('evil-tenant/systemroot/')).toBe(true);
    });
  });

  describe('File Validation', () => {
    it('should throw FileSizeExceededError if file exceeds size limit', () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB (default limit is 10MB)
      const file = {
        buffer: largeBuffer,
        mimeType: 'image/png',
        originalname: 'avatar.png',
      };

      expect(() => storageService.validateFile(file, { max_size_bytes: 10 * 1024 * 1024 })).toThrow(
        FileSizeExceededError,
      );
    });

    it('should throw InvalidFileTypeError if mime type is not in allowed list', () => {
      const file = {
        buffer: Buffer.from('fake data'),
        mimeType: 'application/x-executable',
        originalname: 'virus.exe',
      };

      expect(() =>
        storageService.validateFile(file, {
          allowed_mime_types: ['image/jpeg', 'image/png'],
        }),
      ).toThrow(InvalidFileTypeError);
    });

    it('should pass validation for valid file within limits', () => {
      const file = {
        buffer: Buffer.from('image content'),
        mimeType: 'image/png',
        originalname: 'pic.png',
      };

      expect(() =>
        storageService.validateFile(file, {
          allowed_mime_types: ['image/png'],
          max_size_bytes: 5 * 1024 * 1024,
        }),
      ).not.toThrow();
    });
  });

  describe('Storage Mock Provider', () => {
    it('should delegate upload, delete, exists, and getUrl to the configured provider', async () => {
      const mockProvider: IStorageProvider = {
        name: 'mock',
        uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/file.png'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        deleteFiles: jest.fn().mockResolvedValue(undefined),
        getFileUrl: jest.fn().mockResolvedValue('https://cdn.example.com/signed-url'),
        fileExists: jest.fn().mockResolvedValue(true),
        getFileMetadata: jest.fn().mockResolvedValue({
          content_length: 1024,
          content_type: 'image/png',
        }),
      };

      storageService.setMockProvider(mockProvider);

      const uploadResult = await storageService.upload('proj-1', 'media', {
        buffer: Buffer.from('data'),
        mimeType: 'image/png',
        originalname: 'pic.png',
      });

      expect(uploadResult.url).toBe('https://cdn.example.com/file.png');
      expect(mockProvider.uploadFile).toHaveBeenCalled();

      await storageService.delete('key-123');
      expect(mockProvider.deleteFile).toHaveBeenCalledWith('key-123');

      const exists = await storageService.exists('key-123');
      expect(exists).toBe(true);

      const url = await storageService.getUrl('key-123');
      expect(url).toBe('https://cdn.example.com/signed-url');
    });
  });
});
