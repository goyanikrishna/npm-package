// Role Module Type Definitions
export interface ICreateRolePayload {
  name: string;
  description?: string;
  is_system?: boolean;
  permission_keys?: string[];
}

export interface IUpdateRolePayload {
  name?: string;
  description?: string;
  permission_keys?: string[];
}

// Backward-compatibility aliases (aligning with docs2 conventions)
export type ICreateRoleDto = ICreateRolePayload;
export type IUpdateRoleDto = IUpdateRolePayload;
