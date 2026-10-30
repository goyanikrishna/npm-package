// Password Service for node-backend-toolkit
import bcrypt from 'bcryptjs';
import { configManager } from '../../config/config.manager';
import { IPasswordPolicyConfig } from '../../config/types';
import { BadRequestException } from '../../errors/base.error';

export class PasswordService {
  public async hashPassword(password: string, salt_rounds?: number): Promise<string> {
    const authConfig = configManager.getAuth();
    const rounds = salt_rounds || authConfig.password?.salt_rounds || 12;
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
      min_length: 8,
      max_length: 128,
      require_uppercase: true,
      require_lowercase: true,
      require_digit: true,
      require_special_char: false,
      ...authConfig.password,
      ...customPolicy,
    };

    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Password is required');
    }

    if (password.length < policy.min_length) {
      throw new BadRequestException(
        `Password must be at least ${policy.min_length} characters long`,
      );
    }

    if (password.length > policy.max_length) {
      throw new BadRequestException(`Password cannot exceed ${policy.max_length} characters`);
    }

    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (policy.require_digit && !/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one digit');
    }

    if (policy.require_special_char && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }

  public async validateAndHash(
    password: string,
    customPolicy?: IPasswordPolicyConfig,
  ): Promise<string> {
    this.validatePolicy(password, customPolicy);
    return this.hashPassword(password);
  }
}

export const passwordService = new PasswordService();
