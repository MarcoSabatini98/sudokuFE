export interface ApiResponse<T> {
  status: string;
  success: boolean;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
