// Common types used across the application

/**
 * @deprecated Используйте Role из '@/api/types/rbac' для работы с ролями.
 * Роли управляются на бекенде и могут изменяться, добавляться, удаляться.
 * Для проверки доступа используйте usePermissions() composable с permissions, а не имена ролей.
 * 
 * Этот тип оставлен только для обратной совместимости с legacy кодом.
 * 
 * ⚠️ НЕ ИСПОЛЬЗУЙТЕ для новой логики доступа!
 * ✅ Используйте: hasPermission('materials.create') вместо hasRole('admin')
 */
export type UserRole = 
  | "admin"
  | "manager"
  | "brigadier"
  | "warehouse"
  | "requester"
  // Устаревшие роли (больше не используются):
  | "director"
  | "coordinator";

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

// Re-export Me from employees
export type { Me } from './employees';