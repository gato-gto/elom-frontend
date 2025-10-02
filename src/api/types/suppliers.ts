// Supplier types

import type { PaginationParams, SearchParams, OrderingParams } from './common';

export interface PurchaseSupplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  comment?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseSupplierCreateRequest {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  comment?: string;
  is_active?: boolean;
}

export interface PurchaseSupplierUpdateRequest {
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  comment?: string;
  is_active?: boolean;
}

// Filter parameters
export interface PurchaseSupplierListFilters {
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Paginated response
export interface PaginatedPurchaseSupplierList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PurchaseSupplier[];
}

// Алиасы для совместимости
export type Supplier = PurchaseSupplier;
export type SupplierCreateRequest = PurchaseSupplierCreateRequest;
export type SupplierUpdateRequest = PurchaseSupplierUpdateRequest;
export type SupplierFilterParams = PurchaseSupplierListFilters;
export type PaginatedSupplierList = PaginatedPurchaseSupplierList;