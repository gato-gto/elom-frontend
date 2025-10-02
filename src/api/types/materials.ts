// Material types

import type { PaginationParams, SearchParams, OrderingParams } from './common';

export interface Material {
  id: number;
  name: string;
  sku?: string;
  category?: number;
  category_name: string;
  default_unit: number;
  default_unit_code: string;
  description?: string;
  manufacturer?: string;
  average_price?: string; // decimal as string
  photo_url?: string;
  is_active: boolean;
  created_date?: string;
  purchases_count: number;
  total_purchased_amount: string; // decimal as string
  last_purchase_date?: string;
  current_stock: string; // decimal as string
  created_at: string;
  updated_at: string;
}

export interface MaterialRequest {
  name: string;
  sku?: string;
  category?: number;
  default_unit: number;
  description?: string;
  manufacturer?: string;
  average_price?: string;
  is_active: boolean;
  created_date?: string;
}

export interface PatchedMaterialRequest {
  name?: string;
  sku?: string;
  category?: number;
  default_unit?: number;
  description?: string;
  manufacturer?: string;
  average_price?: string;
  is_active?: boolean;
  created_date?: string;
}

export interface MaterialFormData {
  name: string;
  sku?: string;
  category?: number;
  default_unit: number;
  description?: string;
  manufacturer?: string;
  average_price?: string; // decimal as string
  is_active: boolean;
}

// Filter parameters
export interface MaterialFilterParams extends PaginationParams, SearchParams, OrderingParams {
  category?: number;
  is_active?: boolean;
  default_unit?: number;
  page_size?: number;
}

// Paginated response
export interface PaginatedMaterialList {
  count: number;
  next?: string;
  previous?: string;
  results: Material[];
}

