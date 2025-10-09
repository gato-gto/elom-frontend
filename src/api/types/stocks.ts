// Stock and WriteOff types

import type { Stage, SourceType, PaginationParams, SearchParams, OrderingParams, DateFilterParams, SmartQuantity } from './common';

export interface StockSnapshot {
  id: number;
  date: string;
  object: number;
  object_name: string;
  material: number;
  material_name: string;
  unit: number;
  unit_code: string;
  quantity_signed: string; // decimal as string
  stage: Stage;
  source_type: SourceType;
  source_id: number;
  responsible: number;
  responsible_name?: string;
  comment?: string;
  is_archived: boolean;
  smart_quantity: SmartQuantity;
  source_description: string;
  created_at: string;
  updated_at: string;
}

export interface WriteOff {
  id: number;
  date: string;
  object: number;
  object_name: string;
  material: number;
  material_name: string;
  unit: number;
  unit_code: string;
  quantity: string; // decimal as string
  stage: Stage;
  responsible: number;
  responsible_name?: string;
  comment?: string;
  is_archived: boolean;
  current_balance: string; // decimal as string
  smart_quantity: SmartQuantity;
  created_at: string;
  updated_at: string;
}

// Request types
export interface StockSnapshotCreateRequest {
  date: string;
  object: number;
  material: number | null; // nullable according to API
  unit: number;
  quantity_signed: string; // decimal as string
  stage: Stage;
  source_type: SourceType;
  source_id: number;
  responsible: number;
  comment?: string;
}

export interface StockSnapshotUpdateRequest {
  date?: string;
  object?: number;
  material?: number | null; // nullable according to API
  unit?: number;
  quantity_signed?: string; // decimal as string
  stage?: Stage;
  source_type?: SourceType;
  source_id?: number;
  responsible?: number;
  comment?: string;
}

export interface WriteOffCreateRequest {
  date: string;
  object: number;
  material: number | null; // nullable according to API
  unit: number;
  quantity: string; // decimal as string
  stage: Stage;
  responsible: number;
  comment?: string;
}

export interface WriteOffUpdateRequest {
  date?: string;
  object?: number;
  material?: number | null; // nullable according to API
  unit?: number;
  quantity?: string; // decimal as string
  stage?: Stage;
  responsible?: number;
  comment?: string;
}

// Form data
export interface WriteOffFormData {
  date: string;
  object: number;
  material: number;
  unit: number;
  quantity: string; // decimal as string
  stage: Stage;
  responsible: number;
  comment?: string;
}

// Filter parameters
export interface StockSnapshotFilterParams extends PaginationParams, SearchParams, OrderingParams, DateFilterParams {
  object?: number;
  material?: number;
  stage?: Stage;
  source_type?: SourceType;
  source_id?: number;
  responsible?: number;
  is_archived?: boolean;
}

export interface WriteOffFilterParams extends PaginationParams, SearchParams, OrderingParams, DateFilterParams {
  object?: number;
  material?: number;
  stage?: Stage;
  responsible?: number;
  is_archived?: boolean;
}

// Balance types
export interface MaterialBalance {
  material_id: number;
  material_name: string;
  unit_code: string;
  current_balance: string;
  total_purchased: string;
  total_written_off: string;
}

export interface ObjectBalance {
  object_id: number;
  object_name: string;
  object_address: string;
  materials: MaterialBalance[];
  total_materials: number;
}

export interface BalancesByObjectsResponse {
  date: string;
  objects: ObjectBalance[];
  total_objects: number;
}

export interface MaterialBalanceResponse {
  object_id: number;
  material_id: number;
  date: string;
  current_balance: string;
  total_purchased: string;
  total_written_off: string;
  last_snapshot_date?: string;
  last_snapshot_quantity: string;
}