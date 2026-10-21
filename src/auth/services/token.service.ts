// Password Reset Token Service
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { getDataSource } from '../../database/datasource';
import { InvalidTokenError, TokenExpiredError } from '../../errors/auth.errors';

export class TokenService {
  private get repo(): Repository<PasswordResetToken> {
    return getDataSource().getRepository(PasswordResetToken);
  }

  public async createPasswordResetToken(
    projectId: string,
    email: string,
    expiryMinutes: number = 60,
  ): Promise<PasswordResetToken> {
    // Invalidate existing tokens for this project + email
    await this.repo.update({ project_id: projectId, email, is_used: false }, { is_used: true });

    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const record = this.repo.create({
      project_id: projectId,
      email: email.toLowerCase().trim(),
      token: tokenString,
      is_used: false,
      expires_at: expiresAt,
    });

    return this.repo.save(record);
  }

  public async verifyPasswordResetToken(token: string): Promise<PasswordResetToken> {
    if (!token) {
      throw new InvalidTokenError('Password reset token is required');
    }

    const record = await this.repo.findOne({ where: { token } });

    if (!record || record.is_used) {
      throw new InvalidTokenError('Invalid or already used password reset token');
    }

    if (record.expires_at < new Date()) {
      throw new TokenExpiredError('Password reset link has expired');
    }

    return record;
  }

  public async markTokenUsed(token: string): Promise<void> {
    await this.repo.update({ token }, { is_used: true });
  }
}

export const tokenService = new TokenService();
