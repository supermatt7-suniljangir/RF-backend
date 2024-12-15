export interface UserQueryParams {
  query?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: "featured" | "isAvailableForHire";
}
export interface ProjectQueryParams {
  query?: string;
  category?: string;
  tag?: string;
  status?: "draft" | "published";
  featured?: boolean;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: "featured" | "isAvailableForHire";
}

export interface PaginationMetadata {
  total: number;
  page: number;
  pages: number;
  limit?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
