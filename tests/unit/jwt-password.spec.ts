// JWT & Password Service Unit Tests
import { jwtService } from '../../src/auth/services/jwt.service';
import { passwordService } from '../../src/auth/services/password.service';
import { configManager } from '../../src/config/config.manager';
import { InvalidTokenError, TokenExpiredError } from '../../src/errors/auth.errors';
import { BadRequestException } from '../../src/errors/base.error';

describe('JWT & Password Services', () => {
  beforeAll(() => {
    configManager.initialize({
      project: { name: 'Test App' },
      database: { host: 'localhost', port: 5432, username: 'pg', database: 'db' },
      auth: {
        jwt: {
          access_token_secret: 'super-secret-access-token-key-12345',
          refresh_token_secret: 'super-secret-refresh-token-key-12345',
          access_token_expiry: '15m',
        },
        password: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_digit: true,
          require_special_char: false,
        },
      },
      superAdmin: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'Password123!',
      },
    });
  });

  describe('JWT Service', () => {
    const payload = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      project_id: '987fcdeb-51a2-43f7-9876-ba0987654321',
      email: 'user@example.com',
      role: 'user',
    };

    it('should sign and verify valid JWT access tokens', () => {
      const token = jwtService.signAccessToken(payload);
      expect(typeof token).toBe('string');

      const verified = jwtService.verifyAccessToken(token);
      expect(verified.id).toBe(payload.id);
      expect(verified.project_id).toBe(payload.project_id);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);
    });

    it('should throw InvalidTokenError on tampered or malformed tokens', () => {
      expect(() => jwtService.verifyAccessToken('invalid.token.signature')).toThrow(
        InvalidTokenError,
      );
    });

    it('should throw TokenExpiredError on expired tokens', () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(payload, 'super-secret-access-token-key-12345', {
        expiresIn: '-1s',
      });

      expect(() => jwtService.verifyAccessToken(expiredToken)).toThrow(TokenExpiredError);
    });
  });

  describe('Password Service', () => {
    it('should hash and verify passwords correctly using bcrypt', async () => {
      const plain = 'StrongPass123';
      const hash = await passwordService.hashPassword(plain, 10);

      expect(hash).not.toBe(plain);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await passwordService.comparePassword(plain, hash);
      expect(isValid).toBe(true);

      const isInvalid = await passwordService.comparePassword('WrongPass123', hash);
      expect(isInvalid).toBe(false);
    });

    it('should validate password policies', () => {
      // Valid password
      expect(() => passwordService.validatePolicy('ValidPass123')).not.toThrow();

      // Too short (< 8)
      expect(() => passwordService.validatePolicy('Short1')).toThrow(BadRequestException);

      // Missing uppercase
      expect(() => passwordService.validatePolicy('lowercase123')).toThrow(BadRequestException);

      // Missing lowercase
      expect(() => passwordService.validatePolicy('UPPERCASE123')).toThrow(BadRequestException);

      // Missing digit
      expect(() => passwordService.validatePolicy('NoDigitsHere')).toThrow(BadRequestException);
    });

    it('should enforce special characters when configured', () => {
      const policyWithSpecial = { require_special_char: true };

      expect(() => passwordService.validatePolicy('NoSpecial123', policyWithSpecial)).toThrow(
        BadRequestException,
      );

      expect(() =>
        passwordService.validatePolicy('WithSpecial123!', policyWithSpecial),
      ).not.toThrow();
    });
  });
});
