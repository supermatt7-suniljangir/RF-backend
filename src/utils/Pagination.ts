import { PaginationMetadata } from "../types/miscellaneous";

class Pagination {
  static normalizePagination(
    options: { page?: string; limit?: string } = {},
    defaultLimit = 20,
    maxLimit = 100
  ): { pageNumber: number; limitNumber: number; skip: number } {
    const { page = "1", limit = defaultLimit } = options;
    const pageNumber = Math.max(1, parseInt(page as string, 10));
    const limitNumber = Math.min(
      maxLimit,
      Math.max(1, parseInt(limit as string, 10))
    );
    const skip = (pageNumber - 1) * limitNumber;

    return { pageNumber, limitNumber, skip };
  }

   static buildPaginationResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): { data: T[]; pagination: PaginationMetadata } {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        pages: totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

export default Pagination;
