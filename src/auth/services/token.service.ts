// Password Reset Token Service
import { getDataSource } from '../../database/datasource';
import { InvalidTokenError, TokenExpiredError } from '../../errors/auth.errors';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import crypto from 'crypto';
import { Repository } from 'typeorm';

const getTokenRepo = (): Repository<PasswordResetToken> => {
  return getDataSource().getRepository(PasswordResetToken);
};

const getRepo = (): Repository<PasswordResetToken> => {
  return (tokenService as { repo?: Repository<PasswordResetToken> }).repo || getTokenRepo();
};

/**
 * Hashes a raw reset token using SHA-256 for secure database storage (SEC-01).
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createPasswordResetToken = async (
  project_id: string,
  email: string,
  expiryMinutes: number = 60,
): Promise<PasswordResetToken & { raw_token: string }> => {
  const repo = getRepo();
  const normalizedEmail = email.toLowerCase().trim();
  // Invalidate existing tokens for this project + email
  await repo.update(
    { project_id, email: normalizedEmail, is_used: false },
    { is_used: true },
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const record = repo.create({
    project_id,
    email: normalizedEmail,
    token: tokenHash,
    is_used: false,
    expires_at: expiresAt,
  });

  const saved = await repo.save(record);

  // Return the saved record with the raw unhashed token so email dispatch and URLs receive rawToken
  return Object.assign(saved, {
    token: rawToken,
    raw_token: rawToken,
  });
};

export const verifyPasswordResetToken = async (
  token: string,
  project_id?: string,
): Promise<PasswordResetToken> => {
  if (!token) {
    throw new InvalidTokenError('Password reset token is required');
  }

  const repo = getRepo();
  const tokenHash = hashToken(token);

  // Check hashed token in DB first (SEC-01)
  const where: { token: string; project_id?: string } = { token: tokenHash };
  if (project_id) {
    where.project_id = project_id;
  }

  let record = await repo.findOne({ where });

  // Fallback check for any legacy unhashed tokens in DB
  if (!record) {
    const legacyWhere: { token: string; project_id?: string } = { token };
    if (project_id) {
      legacyWhere.project_id = project_id;
    }
    record = await repo.findOne({ where: legacyWhere });
  }

  if (!record || record.is_used) {
    throw new InvalidTokenError('Invalid or already used password reset token');
  }

  if (record.expires_at < new Date()) {
    throw new TokenExpiredError('Password reset link has expired');
  }

  return record;
};

export const markTokenUsed = async (tokenOrId: string): Promise<void> => {
  const repo = getRepo();
  const tokenHash = hashToken(tokenOrId);
  await repo
    .createQueryBuilder()
    .update(PasswordResetToken)
    .set({ is_used: true })
    .where('id = :id OR token = :token OR token = :tokenHash', {
      id: tokenOrId,
      token: tokenOrId,
      tokenHash,
    })
    .execute();
};

export const tokenService = {
  get repo(): Repository<PasswordResetToken> {
    return getTokenRepo();
  },
  hashToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markTokenUsed,
};
