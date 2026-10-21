// Auth Types Definitions
import { User } from '../user/entities/user.entity';

export interface IJwtPayload {
  id: string;
  project_id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number | string;
}

export interface ILoginResponse {
  user: Partial<User>;
  tokens: IAuthTokens;
}

export interface IRegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  language?: string;
  profile?: Record<string, unknown>;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IForgotPasswordDto {
  email: string;
}

export interface IResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface IChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
