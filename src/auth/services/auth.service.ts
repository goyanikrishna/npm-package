// Auth Service orchestrating authentication flows
import {
  IAuthTokens,
  IChangePasswordDto,
  ILoginDto,
  ILoginResponse,
  IRegisterDto,
  IResetPasswordDto,
} from '../types';
import { User } from '../../user/entities/user.entity';
import { userService } from '../../user/services/user.service';
import { passwordService } from './password.service';
import { jwtService } from './jwt.service';
import { sessionService } from '../../session/services/session.service';
import { tokenService } from './token.service';
import { emailService } from '../../email/services/email.service';
import { configManager } from '../../config/config.manager';
import { getDataSource } from '../../database/datasource';
import {
  InvalidCredentialsError,
  NotMatchException,
  UserInactiveError,
  UserNotFoundError,
} from '../../errors';
import { SuperAdminProtectedError } from '../../errors/user.errors';

export interface IClientMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  public async register(
    projectId: string,
    dto: IRegisterDto,
    clientMeta?: IClientMetadata,
  ): Promise<ILoginResponse> {
    passwordService.validatePolicy(dto.password);

    const safeUser = await userService.createUser(projectId, {
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      language: dto.language,
      profile: dto.profile,
    });

    const tokens = await this.generateTokenPair(
      safeUser.id!,
      projectId,
      safeUser.email!,
      safeUser.role || 'user',
      clientMeta,
    );

    // Send welcome email asynchronously
    emailService
      .sendWelcomeEmail(safeUser.email!, {
        firstName: safeUser.first_name || '',
      })
      .catch(() => {});

    return {
      user: safeUser,
      tokens,
    };
  }

  public async login(
    projectId: string,
    dto: ILoginDto,
    clientMeta?: IClientMetadata,
  ): Promise<ILoginResponse> {
    const user = await userService.getUserByEmail(projectId, dto.email, true);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isMatch = await user.checkIfPasswordMatch(dto.password);
    if (!isMatch) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== 'active') {
      throw new UserInactiveError(`Account is ${user.status}. Please contact administrator.`);
    }

    const tokens = await this.generateTokenPair(
      user.id,
      projectId,
      user.email,
      user.role,
      clientMeta,
    );

    return {
      user: userService.sanitizeUser(user),
      tokens,
    };
  }

  public async refreshToken(
    refreshToken: string,
    clientMeta?: IClientMetadata,
    projectId?: string,
  ): Promise<IAuthTokens> {
    const session = await sessionService.findValidSession(refreshToken, projectId);
    const user = await userService.getUserById(session.user_id, session.project_id);

    if (user.status !== 'active') {
      await sessionService.revokeSession(refreshToken, projectId);
      throw new UserInactiveError('User account is inactive');
    }

    // Revoke old session token (Token Rotation - Decision D04)
    await sessionService.revokeSession(refreshToken, projectId);

    // Issue new token pair
    return this.generateTokenPair(user.id, session.project_id, user.email, user.role, clientMeta);
  }

  public async forgotPassword(
    projectId: string,
    email: string,
  ): Promise<{ token: string; email: string }> {
    const user = await userService.getUserByEmail(projectId, email);
    if (!user) {
      // For security, don't reveal email existence; return success-like object
      return { token: '', email };
    }

    const resetToken = await tokenService.createPasswordResetToken(projectId, email);

    // Send password reset email asynchronously
    emailService
      .sendForgotPasswordEmail(email, {
        token: resetToken.token,
      })
      .catch(() => {});

    return { token: resetToken.token, email };
  }

  public async resetPassword(dto: IResetPasswordDto): Promise<void> {
    const resetRecord = await tokenService.verifyPasswordResetToken(dto.token);
    passwordService.validatePolicy(dto.newPassword);

    const user = await userService.getUserByEmail(resetRecord.project_id, resetRecord.email, true);
    if (!user) {
      throw new UserNotFoundError('User associated with reset token not found');
    }

    const newHashed = await passwordService.hashPassword(dto.newPassword);
    user.password = newHashed;
    await getDataSource().getRepository(User).save(user);

    // Mark reset token used
    await tokenService.markTokenUsed(resetRecord.token);

    // Revoke all existing sessions for security
    await sessionService.revokeAllUserSessions(user.id);

    // Send confirmation email
    emailService.sendPasswordResetSuccessEmail(user.email).catch(() => {});
  }

  public async changePassword(
    userId: string,
    projectId: string,
    dto: IChangePasswordDto,
  ): Promise<void> {
    const user = await userService.getUserById(userId, projectId);
    const userWithPassword = await userService.getUserByEmail(projectId, user.email, true);

    if (!userWithPassword) {
      throw new UserNotFoundError();
    }

    const currentPassword = dto.currentPassword || (dto as any).oldPassword;
    const isMatch = await userWithPassword.checkIfPasswordMatch(currentPassword);
    if (!isMatch) {
      throw new NotMatchException('Current password does not match');
    }

    passwordService.validatePolicy(dto.newPassword);
    const newHashed = await passwordService.hashPassword(dto.newPassword);
    userWithPassword.password = newHashed;

    await getDataSource().getRepository(User).save(userWithPassword);

    // Revoke other user sessions
    await sessionService.revokeAllUserSessions(userId);

    // Send alert email
    emailService.sendPasswordChangedEmail(user.email).catch(() => {});
  }

  public async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await sessionService.revokeSession(refreshToken);
    }
  }

  public async deleteAccount(
    userId: string,
    projectId: string,
    passwordConfirmation: string,
  ): Promise<void> {
    const user = await userService.getUserByEmail(
      projectId,
      (await userService.getUserById(userId, projectId)).email,
      true,
    );

    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.role === 'super_admin') {
      throw new SuperAdminProtectedError('Super Admin accounts cannot be deleted');
    }

    const isMatch = await user.checkIfPasswordMatch(passwordConfirmation);
    if (!isMatch) {
      throw new NotMatchException('Password confirmation does not match');
    }

    const userEmail = user.email;
    await userService.deleteUser(userId, projectId, userId);
    await sessionService.revokeAllUserSessions(userId);

    // Send farewell email
    emailService.sendAccountDeletedEmail(userEmail).catch(() => {});
  }

  private async generateTokenPair(
    userId: string,
    projectId: string,
    email: string,
    role: string,
    clientMeta?: IClientMetadata,
  ): Promise<IAuthTokens> {
    const authConfig = configManager.getAuth();
    const accessToken = jwtService.signAccessToken({
      id: userId,
      project_id: projectId,
      email,
      role,
    });

    const session = await sessionService.createSession({
      userId,
      projectId,
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });

    return {
      access_token: accessToken,
      refresh_token: session.refresh_token,
      token_type: 'Bearer',
      expires_in: authConfig.jwt.accessTokenExpiry || '15m',
    };
  }
}

export const authService = new AuthService();
