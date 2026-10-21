// Utilities and Error Formatting Unit Tests
import { sendResponse } from '../../src/utils/response.util';
import { parsePagination, formatPaginatedResponse } from '../../src/utils/pagination.util';
import { slugify } from '../../src/utils/slug.util';
import { normalizeEmail } from '../../src/utils/email-normalizer.util';
import { formatErrorResponse } from '../../src/errors/error-handler';
import {
  ToolkitError,
  BadRequestException,
  ForbiddenException,
  UserNotFoundError,
} from '../../src/errors';

describe('Utilities & Error Handling', () => {
  describe('Response Utility', () => {
    it('should format successful response object matching reference schema', () => {
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((payload) => payload),
      };

      const result = sendResponse(mockRes, { user: 'Alice' }, 'User created', 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(result).toEqual({
        success: true,
        status: 201,
        message: 'User created',
        data: { user: 'Alice' },
      });
    });
  });

  describe('Error Formatter', () => {
    it('should format ToolkitError correctly', () => {
      const err = new UserNotFoundError('Target user was not found');
      const response = formatErrorResponse(err);

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.message).toBe('Target user was not found');
      expect(response.error_code).toBe('USER_NOT_FOUND');
      expect(response.data).toBeNull();
    });

    it('should format ForbiddenException with required permissions', () => {
      const err = new ForbiddenException('Access denied', ['users:create']);
      const response = formatErrorResponse(err);

      expect(response.success).toBe(false);
      expect(response.status).toBe(403);
      expect(response.error_code).toBe('PERMISSION_DENIED');
      expect(response.errors).toEqual({ required_permissions: ['users:create'] });
    });

    it('should format Postgres unique constraint error (23505)', () => {
      const pgErr = {
        name: 'QueryFailedError',
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      };

      const response = formatErrorResponse(pgErr);
      expect(response.status).toBe(409);
      expect(response.error_code).toBe('UNIQUE_VIOLATION');
    });
  });

  describe('Pagination Utility', () => {
    it('should parse page, limit, and skip safely', () => {
      const parsed = parsePagination({ page: '2', limit: '25' });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(25);
      expect(parsed.skip).toBe(25);

      const invalid = parsePagination({ page: '-5', limit: 'abc' });
      expect(invalid.page).toBe(1);
      expect(invalid.limit).toBe(20);
      expect(invalid.skip).toBe(0);
    });

    it('should format paginated meta with totalPages, hasNext, hasPrev', () => {
      const items = ['a', 'b', 'c'];
      const paginated = formatPaginatedResponse(items, 50, 2, 10);

      expect(paginated.items).toEqual(items);
      expect(paginated.meta.total).toBe(50);
      expect(paginated.meta.totalPages).toBe(5);
      expect(paginated.meta.page).toBe(2);
      expect(paginated.meta.hasNext).toBe(true);
      expect(paginated.meta.hasPrev).toBe(true);
    });
  });

  describe('Slug and Email Utilities', () => {
    it('should generate URL-friendly slugs', () => {
      expect(slugify('My First Project!')).toBe('my-first-project');
      expect(slugify('  Healthcare & Wellness Inc.  ')).toBe('healthcare-wellness-inc');
    });

    it('should normalize email addresses to lowercase trimmed strings', () => {
      expect(normalizeEmail('  User@Domain.COM ')).toBe('user@domain.com');
    });
  });
});
