// Pagination utility for @node-backend-toolkit

export interface IPaginationQuery {
  page?: number | string;
  limit?: number | string;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginatedResult<T> {
  items: T[];
  meta: IPaginatedMeta;
}

export const parsePagination = (
  query?: IPaginationQuery,
  defaultLimit: number = 20,
  maxLimit: number = 100,
): IPaginationOptions => {
  const pageRaw = Number(query?.page);
  const limitRaw = Number(query?.limit);

  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const rawLimit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : defaultLimit;
  const limit = Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): IPaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
