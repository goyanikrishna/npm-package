// JWT Service for Access Token Management
import jwt, { SignOptions } from 'jsonwebtoken';
import { configManager } from '../../config/config.manager';
import { IJwtPayload } from '../types';
import { InvalidTokenError, TokenExpiredError } from '../../errors/auth.errors';

export class JwtService {
  public signAccessToken(payload: IJwtPayload): string {
    const authConfig = configManager.getAuth();
    const { accessTokenSecret, accessTokenExpiry = '15m', issuer, audience } = authConfig.jwt;

    const options: SignOptions = {
      expiresIn: accessTokenExpiry as SignOptions['expiresIn'],
    };

    if (issuer) options.issuer = issuer;
    if (audience) options.audience = audience;

    return jwt.sign(payload, accessTokenSecret, options);
  }

  public verifyAccessToken(token: string): IJwtPayload {
    if (!token) {
      throw new InvalidTokenError('Access token is required');
    }

    const authConfig = configManager.getAuth();
    const { accessTokenSecret, issuer, audience } = authConfig.jwt;

    try {
      const decoded = jwt.verify(token, accessTokenSecret, {
        issuer,
        audience,
      }) as IJwtPayload;

      return decoded;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Access token has expired');
      }
      throw new InvalidTokenError('Invalid access token');
    }
  }

  public decode(token: string): IJwtPayload | null {
    return jwt.decode(token) as IJwtPayload | null;
  }
}

export const jwtService = new JwtService();
