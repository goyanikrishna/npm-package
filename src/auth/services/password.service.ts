// Password Service for @node-backend-toolkit
import bcrypt from 'bcryptjs';
import { configManager } from '../../config/config.manager';
import { IPasswordPolicyConfig } from '../../config/types';
import { BadRequestException } from '../../errors/base.error';

export class PasswordService {
  public async hashPassword(password: string, saltRounds?: number): Promise<string> {
    const authConfig = configManager.getAuth();
    const rounds = saltRounds || authConfig.password?.saltRounds || 12;
    const salt = await bcrypt.genSalt(rounds);
    return bcrypt.hash(password, salt);
  }

  public async comparePassword(plain: string, hashed: string): Promise<boolean> {
    if (!plain || !hashed) return false;
    return bcrypt.compare(plain, hashed);
  }

  public validatePolicy(password: string, customPolicy?: IPasswordPolicyConfig): void {
    const authConfig = configManager.getAuth();
    const policy = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireDigit: true,
      requireSpecialChar: false,
      ...authConfig.password,
      ...customPolicy,
    };

    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Password is required');
    }

    if (password.length < policy.minLength) {
      throw new BadRequestException(
        `Password must be at least ${policy.minLength} characters long`,
      );
    }

    if (password.length > policy.maxLength) {
      throw new BadRequestException(`Password cannot exceed ${policy.maxLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (policy.requireDigit && !/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one digit');
    }

    if (policy.requireSpecialChar && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }
}

export const passwordService = new PasswordService();
