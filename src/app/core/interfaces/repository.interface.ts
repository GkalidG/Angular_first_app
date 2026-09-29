export interface ApiResponse<T> {
  data: T;
  timestamp: Date;
}

export interface Repository<T> {
  getById(id: string): Promise<ApiResponse<T>>;
  getAll(): Promise<ApiResponse<T[]>>;
  create(entity: Omit<T, 'id'>): Promise<ApiResponse<T>>;
  update(id: string, entity: Partial<T>): Promise<ApiResponse<T>>;
  delete(id: string): Promise<void>;
}
