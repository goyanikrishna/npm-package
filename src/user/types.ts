// User Module Type Definitions
import type { IPaginationQuery } from '../utils/pagination.util';

export interface ICreateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  phone?: string;
  role?: string;
  status?: string;
  language?: string;
  avatar?: string;
  profile?: Record<string, unknown>;
  [key: string]: any;
}

export interface IUpdateUserPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  language?: string;
  avatar?: string;
  password?: string;
  profile?: Record<string, unknown>;
  [key: string]: any;
}

export interface IUserListQuery extends IPaginationQuery {
  search?: string;
  role?: string;
  status?: string;
}

// Backward-compatibility aliases (aligning with docs2 conventions)
export type ICreateUserDto = ICreateUserPayload;
export type IUpdateUserDto = IUpdateUserPayload;
export type IUserFilterQuery = IUserListQuery;
