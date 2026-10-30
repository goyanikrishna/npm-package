// Auth Service orchestrating authentication flows
import {
  IAuthTokens,
  IChangePasswordDto,
  IClientMetadata,
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

export { IClientMetadata };

export class AuthService {
  public async register(
    project_id: string,
    dto: IRegisterDto,
    clientMeta?: IClientMetadata,
  ): Promise<ILoginResponse> {
    passwordService.validatePolicy(dto.password);

    const first_name = (dto.first_name || '').trim();
    const last_name = (dto.last_name || '').trim();

    const safeUser = await userService.createUser(project_id, {
      email: dto.email,
      password: dto.password,
      first_name,
      last_name,
      phone: dto.phone,
      language: dto.language,
      profile: dto.profile,
    });

    const tokens = await this.generateTokenPair(
      safeUser.id!,
      project_id,
      safeUser.email!,
      safeUser.role || 'user',
      clientMeta,
    );

    // Send welcome email asynchronously
    emailService
      .sendWelcomeEmail(safeUser.email!, {
        first_name: safeUser.first_name || '',
      })
      .catch(() => {});

    return {
      user: safeUser,
      tokens,
    };
  }

  public async login(
    project_id: string,
    dto: ILoginDto,
    clientMeta?: IClientMetadata,
  ): Promise<ILoginResponse> {
    const user = await userService.getUserByEmail(project_id, dto.email, true);

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
      project_id,
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
    project_id?: string,
  ): Promise<IAuthTokens> {
    const session = await sessionService.findValidSession(refreshToken, project_id);
    const user = await userService.getUserById(session.user_id, session.project_id);

    if (user.status !== 'active') {
      await sessionService.revokeSession(refreshToken, project_id);
      throw new UserInactiveError('User account is inactive');
    }

    // Revoke old session token (Token Rotation - Decision D04)
    await sessionService.revokeSession(refreshToken, project_id);

    // Issue new token pair
    return this.generateTokenPair(user.id, session.project_id, user.email, user.role, clientMeta);
  }

  public async forgotPassword(
    project_id: string,
    email: string,
  ): Promise<{ token: string; email: string }> {
    const user = await userService.getUserByEmail(project_id, email);
    if (!user) {
      // For security, don't reveal email existence; return success-like object
      return { token: '', email };
    }

    const resetToken = await tokenService.createPasswordResetToken(project_id, email);

    // Send password reset email asynchronously
    emailService
      .sendForgotPasswordEmail(email, {
        token: resetToken.token,
      })
      .catch(() => {});

    return { token: resetToken.token, email };
  }

  public async resetPassword(dto: IResetPasswordDto, project_id?: string): Promise<void> {
    const resetRecord = await tokenService.verifyPasswordResetToken(dto.token, project_id);

    const user = await userService.getUserByEmail(resetRecord.project_id, resetRecord.email, true);
    if (!user) {
      throw new UserNotFoundError('User associated with reset token not found');
    }

    user.password = await passwordService.validateAndHash(dto.new_password);
    await getDataSource().getRepository(User).save(user);

    // Mark reset token used
    await tokenService.markTokenUsed(resetRecord.token);

    // Revoke all existing sessions for security
    await sessionService.revokeAllUserSessions(user.id);

    // Send confirmation email
    emailService.sendPasswordResetSuccessEmail(user.email).catch(() => {});
  }

  public async changePassword(
    user_id: string,
    project_id: string,
    dto: IChangePasswordDto,
  ): Promise<void> {
    const user = await userService.getUserById(user_id, project_id);
    const userWithPassword = await userService.getUserByEmail(project_id, user.email, true);

    if (!userWithPassword) {
      throw new UserNotFoundError();
    }

    const isMatch = await userWithPassword.checkIfPasswordMatch(dto.current_password);
    if (!isMatch) {
      throw new NotMatchException('Current password does not match');
    }

    userWithPassword.password = await passwordService.validateAndHash(dto.new_password);
    await getDataSource().getRepository(User).save(userWithPassword);

    // Revoke other user sessions
    await sessionService.revokeAllUserSessions(user_id);

    // Send alert email
    emailService.sendPasswordChangedEmail(user.email).catch(() => {});
  }

  public async logout(refreshToken: string, project_id?: string): Promise<void> {
    if (refreshToken) {
      await sessionService.revokeSession(refreshToken, project_id);
    }
  }

  public async deleteAccount(
    user_id: string,
    project_id: string,
    passwordConfirmation: string,
  ): Promise<void> {
    const user = await userService.getUserByEmail(
      project_id,
      (await userService.getUserById(user_id, project_id)).email,
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
    await userService.deleteUser(user_id, project_id, user_id);
    await sessionService.revokeAllUserSessions(user_id);

    // Send farewell email
    emailService.sendAccountDeletedEmail(userEmail).catch(() => {});
  }

  private async generateTokenPair(
    user_id: string,
    project_id: string,
    email: string,
    role: string,
    clientMeta?: IClientMetadata,
  ): Promise<IAuthTokens> {
    const authConfig = configManager.getAuth();
    const accessToken = jwtService.signAccessToken({
      id: user_id,
      project_id,
      email,
      role,
    });

    const session = await sessionService.createSession({
      user_id,
      project_id,
      ip_address: clientMeta?.ip_address,
      user_agent: clientMeta?.user_agent,
    });

    return {
      access_token: accessToken,
      refresh_token: session.refresh_token,
      token_type: 'Bearer',
      expires_in: authConfig.jwt.access_token_expiry || '15m',
    };
  }
}

export const authService = new AuthService();
