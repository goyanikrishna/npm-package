// Password Reset Token Service
import { getDataSource } from '../../database/datasource';
import { InvalidTokenError, TokenExpiredError } from '../../errors/auth.errors';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import crypto from 'crypto';
import { Repository } from 'typeorm';

export class TokenService {
  private get repo(): Repository<PasswordResetToken> {
    return getDataSource().getRepository(PasswordResetToken);
  }

  /**
   * Hashes a raw reset token using SHA-256 for secure database storage (SEC-01).
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async createPasswordResetToken(
    project_id: string,
    email: string,
    expiryMinutes: number = 60,
  ): Promise<PasswordResetToken & { raw_token: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    // Invalidate existing tokens for this project + email
    await this.repo.update(
      { project_id, email: normalizedEmail, is_used: false },
      { is_used: true },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const record = this.repo.create({
      project_id,
      email: normalizedEmail,
      token: tokenHash,
      is_used: false,
      expires_at: expiresAt,
    });

    const saved = await this.repo.save(record);

    // Return the saved record with the raw unhashed token so email dispatch and URLs receive rawToken
    return Object.assign(saved, {
      token: rawToken,
      raw_token: rawToken,
    });
  }

  public async verifyPasswordResetToken(
    token: string,
    project_id?: string,
  ): Promise<PasswordResetToken> {
    if (!token) {
      throw new InvalidTokenError('Password reset token is required');
    }

    const tokenHash = this.hashToken(token);

    // Check hashed token in DB first (SEC-01)
    const where: { token: string; project_id?: string } = { token: tokenHash };
    if (project_id) {
      where.project_id = project_id;
    }

    let record = await this.repo.findOne({ where });

    // Fallback check for any legacy unhashed tokens in DB
    if (!record) {
      const legacyWhere: { token: string; project_id?: string } = { token };
      if (project_id) {
        legacyWhere.project_id = project_id;
      }
      record = await this.repo.findOne({ where: legacyWhere });
    }

    if (!record || record.is_used) {
      throw new InvalidTokenError('Invalid or already used password reset token');
    }

    if (record.expires_at < new Date()) {
      throw new TokenExpiredError('Password reset link has expired');
    }

    return record;
  }

  public async markTokenUsed(tokenOrId: string): Promise<void> {
    const tokenHash = this.hashToken(tokenOrId);
    await this.repo
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ is_used: true })
      .where('id = :id OR token = :token OR token = :tokenHash', {
        id: tokenOrId,
        token: tokenOrId,
        tokenHash,
      })
      .execute();
  }
}

export const tokenService = new TokenService();
