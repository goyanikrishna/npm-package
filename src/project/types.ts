// Project Module Type Definitions
export interface ICreateProjectPayload {
  name: string;
  slug?: string;
  description?: string;
  status?: string;
}

export interface IUpdateProjectPayload {
  name?: string;
  description?: string;
  status?: string;
}

// Backward-compatibility aliases (aligning with docs2 conventions)
export type ICreateProjectDto = ICreateProjectPayload;
export type IUpdateProjectDto = IUpdateProjectPayload;
