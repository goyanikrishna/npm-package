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

export interface ICreateSessionOptions {
  userId: string;
  projectId: string;
  ipAddress?: string;
  userAgent?: string;
}

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
    const expirySetting = authConfig.jwt.refreshTokenExpiry || '7d';
    const durationMs = this.parseDurationMs(expirySetting);
    const expiresAt = new Date(Date.now() + durationMs);

    const refreshToken = crypto.randomBytes(48).toString('hex');

    const session = this.repo.create({
      user_id: options.userId,
      project_id: options.projectId,
      refresh_token: refreshToken,
      ip_address: options.ipAddress || null,
      user_agent: options.userAgent || null,
      is_revoked: false,
      expires_at: expiresAt,
    });

    return this.repo.save(session);
  }

  public async findValidSession(refreshToken: string): Promise<Session> {
    if (!refreshToken) {
      throw new InvalidTokenError('Refresh token is required');
    }

    const session = await this.repo.findOne({
      where: { refresh_token: refreshToken },
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

  public async revokeSession(refreshToken: string): Promise<void> {
    const session = await this.repo.findOne({ where: { refresh_token: refreshToken } });
    if (session) {
      session.is_revoked = true;
      await this.repo.save(session);
    }
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    await this.repo.update({ user_id: userId }, { is_revoked: true });
  }

  public async cleanupExpiredSessions(): Promise<number> {
    const result = await this.repo.delete({
      expires_at: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}

export const sessionService = new SessionService();
