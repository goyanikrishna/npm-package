// Auth Types Definitions
import type { User } from '../user/entities/user.entity';

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

export interface IRegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  language?: string;
  profile?: Record<string, unknown>;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface IChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface IClientMetadata {
  ip_address?: string;
  user_agent?: string;
}

// Backward-compatibility aliases (aligning with docs2 conventions)
export type IRegisterDto = IRegisterPayload;
export type ILoginDto = ILoginPayload;
export type IForgotPasswordDto = IForgotPasswordPayload;
export type IResetPasswordDto = IResetPasswordPayload;
export type IChangePasswordDto = IChangePasswordPayload;
