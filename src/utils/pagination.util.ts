// Pagination utility for node-backend-toolkit & onyx compatibility

export interface IPaginationQuery {
  page?: number | string;
  limit?: number | string;
  page_size?: number | string;
  per_page?: number | string;
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
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  has_next_page?: boolean;
  has_previous_page?: boolean;
}

export interface IPaginatedResult<T> {
  items: T[];
  data: T[];
  meta: IPaginatedMeta;
}

export const parsePagination = (
  query?: IPaginationQuery,
  defaultLimit: number = 20,
  maxLimit: number = 100,
): IPaginationOptions => {
  const pageRaw = Number(query?.page);
  const limitRaw = Number(query?.per_page ?? query?.page_size ?? query?.limit);

  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const rawLimit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : defaultLimit;
  const limit = Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getPaginationParams = (query: Record<string, unknown> = {}) => {
  const parsed = parsePagination(query as IPaginationQuery);
  return {
    page: parsed.page,
    per_page: parsed.limit,
    skip: parsed.skip,
    take: parsed.limit,
  };
};

export const formatPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): IPaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit) || 1;
  const meta: IPaginatedMeta = {
    total,
    page,
    limit,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
    per_page: limit,
    current_page: page,
    last_page: totalPages,
    has_next_page: page < totalPages,
    has_previous_page: page > 1,
  };

  return {
    items,
    data: items,
    meta,
  };
};

export const paginate = <T>(
  list: T[],
  total: number,
  page: number,
  per_page: number,
): IPaginatedResult<T> => {
  return formatPaginatedResponse(list, total, page, per_page);
};
