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
  validation_warnings: string[];
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
  material?: number;
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
  material?: number;
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