// Password Reset Token Service Unit Tests (SEC-01)
import { tokenService } from '../../src/auth/services/token.service';
import { InvalidTokenError, TokenExpiredError } from '../../src/errors/auth.errors';

describe('Password Reset Token Service (Hashed Token Storage)', () => {
  const projectId = '11111111-2222-3333-4444-555555555555';
  const email = 'doctor@example.com';

  let mockDbTokens: any[] = [];
  let updateMock: jest.Mock;
  let saveMock: jest.Mock;
  let findOneMock: jest.Mock;
  let createMock: jest.Mock;

  beforeEach(() => {
    mockDbTokens = [];

    updateMock = jest.fn().mockImplementation((criteria: any, updateValues: any) => {
      mockDbTokens.forEach((t) => {
        let match = true;
        if (criteria.project_id && t.project_id !== criteria.project_id) match = false;
        if (criteria.email && t.email !== criteria.email) match = false;
        if (criteria.is_used !== undefined && t.is_used !== criteria.is_used) match = false;
        if (criteria.token && t.token !== criteria.token) match = false;
        if (match) {
          Object.assign(t, updateValues);
        }
      });
      return Promise.resolve({ affected: 1 });
    });

    createMock = jest.fn().mockImplementation((entity: any) => ({
      id: 'token-uuid-1234',
      ...entity,
    }));

    saveMock = jest.fn().mockImplementation((entity: any) => {
      mockDbTokens.push({ ...entity });
      return Promise.resolve({ ...entity });
    });

    findOneMock = jest.fn().mockImplementation(({ where }: any) => {
      const found = mockDbTokens.find((t) => {
        if (where.project_id && t.project_id !== where.project_id) return false;
        if (where.token && t.token !== where.token) return false;
        return true;
      });
      return Promise.resolve(found ? { ...found } : null);
    });

    jest.spyOn((tokenService as any), 'repo', 'get').mockReturnValue({
      update: updateMock,
      create: createMock,
      save: saveMock,
      findOne: findOneMock,
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockImplementation(() => {
          mockDbTokens.forEach((t) => (t.is_used = true));
          return Promise.resolve({ affected: 1 });
        }),
      }),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hashToken', () => {
    it('should compute consistent SHA-256 hash for raw tokens', () => {
      const raw = 'abcdef1234567890abcdef1234567890';
      const hash1 = tokenService.hashToken(raw);
      const hash2 = tokenService.hashToken(raw);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 is 64 hex characters
      expect(hash1).not.toBe(raw);
    });
  });

  describe('createPasswordResetToken', () => {
    it('should store SHA-256 hashed token in DB while returning raw token for delivery', async () => {
      const result = await tokenService.createPasswordResetToken(projectId, email);

      // Raw token returned for caller / email
      expect(result.token).toBeDefined();
      expect(result.raw_token).toBeDefined();
      expect(result.token).toBe(result.raw_token);
      expect(result.token.length).toBe(64); // 32 random bytes in hex = 64 hex characters

      // Database record must NOT store raw token
      expect(mockDbTokens.length).toBe(1);
      const storedInDb = mockDbTokens[0];
      expect(storedInDb.token).not.toBe(result.raw_token);
      expect(storedInDb.token).toBe(tokenService.hashToken(result.raw_token));
      expect(storedInDb.is_used).toBe(false);
      expect(storedInDb.email).toBe(email);
    });

    it('should invalidate previous unused tokens for the same project and email', async () => {
      await tokenService.createPasswordResetToken(projectId, email);
      expect(updateMock).toHaveBeenCalledWith(
        { project_id: projectId, email, is_used: false },
        { is_used: true },
      );
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should successfully verify a valid raw token by checking its hash in DB', async () => {
      const created = await tokenService.createPasswordResetToken(projectId, email);
      const verified = await tokenService.verifyPasswordResetToken(created.raw_token, projectId);

      expect(verified).toBeDefined();
      expect(verified.email).toBe(email);
      expect(verified.project_id).toBe(projectId);
    });

    it('should throw InvalidTokenError if token does not match DB hash', async () => {
      await tokenService.createPasswordResetToken(projectId, email);

      await expect(
        tokenService.verifyPasswordResetToken('wrong_raw_token_value', projectId),
      ).rejects.toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError if token is already marked as used', async () => {
      const created = await tokenService.createPasswordResetToken(projectId, email);
      mockDbTokens[0].is_used = true;

      await expect(
        tokenService.verifyPasswordResetToken(created.raw_token, projectId),
      ).rejects.toThrow(InvalidTokenError);
    });

    it('should throw TokenExpiredError if token has expired', async () => {
      const created = await tokenService.createPasswordResetToken(projectId, email, -10); // Expired 10 min ago
      mockDbTokens[0].expires_at = new Date(Date.now() - 10000);

      await expect(
        tokenService.verifyPasswordResetToken(created.raw_token, projectId),
      ).rejects.toThrow(TokenExpiredError);
    });
  });

  describe('markTokenUsed', () => {
    it('should mark token as used in DB using token hash or id', async () => {
      const created = await tokenService.createPasswordResetToken(projectId, email);
      expect(mockDbTokens[0].is_used).toBe(false);

      await tokenService.markTokenUsed(created.raw_token);
      expect(mockDbTokens[0].is_used).toBe(true);
    });
  });
});

