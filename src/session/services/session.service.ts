// Session Service for Refresh Token Management (Decision D04)
import crypto from 'crypto';
import { LessThan, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { getDataSource } from '../../database/datasource';
import { configManager } from '../../config/config.manager';
import {
  InvalidTokenError,
  SessionRevokedError,
  TokenExpiredError,
} from '../../errors/auth.errors';
import { ICreateSessionOptions } from '../types';

export { ICreateSessionOptions };

export class SessionService {
  private get repo(): Repository<Session> {
    return getDataSource().getRepository(Session);
  }

  private parseDurationMs(duration: string | number): number {
    if (typeof duration === 'number') {
      return duration * 1000;
    }
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

    const val = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return val * 1000;
      case 'm':
        return val * 60 * 1000;
      case 'h':
        return val * 60 * 60 * 1000;
      case 'd':
        return val * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  public async createSession(options: ICreateSessionOptions): Promise<Session> {
    const authConfig = configManager.getAuth();
    const expirySetting = authConfig.jwt.refresh_token_expiry || '7d';
    const durationMs = this.parseDurationMs(expirySetting);
    const expiresAt = new Date(Date.now() + durationMs);

    const refreshToken = crypto.randomBytes(48).toString('hex');

    const session = this.repo.create({
      user_id: options.user_id,
      project_id: options.project_id,
      refresh_token: refreshToken,
      ip_address: options.ip_address || null,
      user_agent: options.user_agent || null,
      is_revoked: false,
      expires_at: expiresAt,
    });

    return this.repo.save(session);
  }

  public async findValidSession(refreshToken: string, project_id?: string): Promise<Session> {
    if (!refreshToken) {
      throw new InvalidTokenError('Refresh token is required');
    }

    const where: { refresh_token: string; project_id?: string } = { refresh_token: refreshToken };
    if (project_id) {
      where.project_id = project_id;
    }

    const session = await this.repo.findOne({
      where,
      relations: ['user'],
    });

    if (!session) {
      throw new InvalidTokenError('Invalid refresh token');
    }

    if (session.is_revoked) {
      throw new SessionRevokedError('Refresh token has been revoked');
    }

    if (session.expires_at < new Date()) {
      throw new TokenExpiredError('Refresh token has expired');
    }

    return session;
  }

  public async revokeSession(refreshToken: string, project_id?: string): Promise<void> {
    const where: { refresh_token: string; project_id?: string } = { refresh_token: refreshToken };
    if (project_id) {
      where.project_id = project_id;
    }
    const session = await this.repo.findOne({ where });
    if (session) {
      session.is_revoked = true;
      await this.repo.save(session);
    }
  }

  public async revokeAllUserSessions(user_id: string): Promise<void> {
    await this.repo.update({ user_id }, { is_revoked: true });
  }

  public async cleanupExpiredSessions(): Promise<number> {
    const result = await this.repo.delete({
      expires_at: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}

export const sessionService = new SessionService();
