// Common types used across the application

// Роли системы:
// - admin: Администратор (только через Django Admin)
// - director: Директор (полный доступ ко всем данным)
// - coordinator: Координатор (координация между объектами)
// - brigadier: Бригадир (работа с назначенными объектами)
export type UserRole = 
  | "admin"
  | "director" 
  | "coordinator"
  | "brigadier";

export type Stage = 
  | "acceptance"
  | "request"
  | "delivery_fixed"
  | "post_rough"
  | "handover";

export type SourceType = 
  | "purchase_item"
  | "writeoff";

export type Currency = "UZS";

export type ID = number;

// Common interfaces
export interface Unit {
  id: number;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialCategory {
  id: number;
  name: string;
  parent?: number;
  parent_name?: string;
  children_count: number;
  materials_count: number;
  full_path: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialCategoryLite {
  id: number;
  name: string;
  parent?: number;
  parent_name?: string;
  children_count: number;
  materials_count: number;
  full_path: string;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface PageResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: string[] | string | undefined;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface SearchParams {
  search?: string;
}

export interface OrderingParams {
  ordering?: string;
}

export interface DateFilterParams {
  date_from?: string;
  date_to?: string;
}

export interface PaginationState {
  count: number;
  page: number;
  pageSize: number;
  next: string | null | undefined;
  previous: string | null | undefined;
}

// Smart quantity for unit conversion
export interface SmartQuantity {
  value: number;
  unit: string;
  original_value: number;
  original_unit: string;
  display_value?: number;
  display_unit?: string;
  conversion_applied?: boolean;
}