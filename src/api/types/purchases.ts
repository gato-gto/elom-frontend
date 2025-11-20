// Purchase types

import type { Currency, Stage, SourceType, PaginationParams, SearchParams, OrderingParams, DateFilterParams } from './common';

export interface PurchaseItem {
  id: number;
  material: number;
  material_name: string;
  unit: number;
  unit_code: string;
  quantity: string; // decimal as string
  price?: string; // decimal as string, nullable
  amount?: string; // decimal as string, вычисляется динамически
  created_at: string;
  updated_at: string;
}

export interface PurchasePhoto {
  id: number;
  url: string;
  is_cover: boolean;
  mime: string;
  size_bytes: number;
  created_at: string;
  type: 'instructions' | 'report';
}

export interface Purchase {
  id: number;
  date: string;
  object: number;
  object_name: string;
  supplier: number; // ID поставщика
  supplier_name?: string; // Название поставщика для отображения
  invoice_number?: string;
  currency: Currency;
  comment?: string;
  responsible: number;
  responsible_name?: string;
  total_amount?: number; // вычисляется динамически через агрегацию
  is_archived: boolean;
  cover_photo_url?: string;
  purchase_no: string;
  status: 'new' | 'completed' | 'cancelled';
  items: PurchaseItem[];
  photos: PurchasePhoto[];
  created_at: string;
  updated_at: string;
}

// Request types
export interface PurchaseCreateRequest {
  date: string;
  object: number;
  supplier: number; // ID поставщика
  invoice_number?: string;
  currency: Currency;
  comment?: string;
  responsible?: number; // Опционально - устанавливается автоматически из object.responsible на бэкенде
  status?: 'new' | 'completed' | 'cancelled';
  items: PurchaseItemCreateRequest[];
}

export interface PurchaseUpdateRequest {
  date?: string;
  object?: number;
  supplier?: number; // ID поставщика
  invoice_number?: string;
  currency?: Currency;
  comment?: string;
  responsible?: number;
  status?: 'new' | 'completed' | 'cancelled';
}

export interface PurchaseRequest {
  date: string;
  object: number;
  supplier: number; // ID поставщика
  invoice_number?: string;
  purchase_no?: string;
  currency: Currency;
  comment?: string;
  responsible?: number; // Опционально - устанавливается автоматически из object.responsible на бэкенде
  status?: 'new' | 'completed' | 'cancelled';
  items: PurchaseItemCreateRequest[];
}

export interface PatchedPurchaseRequest {
  date?: string;
  object?: number;
  supplier?: number; // ID поставщика
  invoice_number?: string;
  purchase_no?: string;
  currency?: Currency;
  comment?: string;
  responsible?: number;
  status?: 'new' | 'completed' | 'cancelled';
}

// Item types
export interface PurchaseItemCreateRequest {
  material: number;
  unit: number;
  quantity: string; // decimal as string
  price?: string; // decimal as string, nullable
  amount: string; // decimal as string
}

export interface PurchaseItemUpdateRequest {
  material?: number;
  unit?: number;
  quantity?: string; // decimal as string
  price?: string; // decimal as string
  amount?: string; // decimal as string
}

export interface PurchaseItemRequest {
  material: number;
  unit: number;
  quantity: string;
  price?: string;
  amount: string;
  _k?: string;
  total?: number;
}

// Bulk operations
export interface PurchaseDuplicateRequest {
  date: string;
  object: number;
}

export interface PurchaseBulkArchiveRequest {
  purchase_ids: number[];
}

export interface PurchaseBulkDeleteRequest {
  purchase_ids: number[];
}

export interface PurchaseItemBulkCreateRequest {
  items: PurchaseItemCreateRequest[];
}

export interface PurchaseItemBulkUpdateRequest {
  items: Array<{
    id: number;
    material?: number;
    unit?: number;
    quantity?: string; // decimal as string
    price?: string; // decimal as string
    amount?: string; // decimal as string
  }>;
}

export interface PurchasePhotoBulkUploadRequest {
  files: File[];
}

export interface PurchasePhotoReorderRequest {
  photo_ids: number[];
}

export interface PurchasePhotoUploadRequest {
  photo: File;
  is_cover?: boolean;
  photo_type?: 'instructions' | 'report';
}

// Form data
export interface PurchaseFormData {
  date: string;
  object: number;
  supplier: string;
  invoice_number?: string;
  currency: Currency;
  comment?: string;
  responsible: number;
  items: Array<{
    material: number;
    unit: number;
    quantity: string; // decimal as string
    price?: string; // decimal as string, nullable
    amount: string; // decimal as string
  }>;
}

// Filter parameters
export interface PurchaseFilterParams extends PaginationParams, SearchParams, OrderingParams, DateFilterParams {
  object?: number;
  responsible?: number;
  is_archived?: boolean;
  currency?: Currency;
  material?: number;
  date_after?: string;
  date_before?: string;
}

export interface PurchaseListFilters {
  search?: string;
  object?: number;
  responsible?: number;
  is_archived?: boolean;
  currency?: Currency;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PurchaseExportQuery {
  search?: string;
  object?: number;
  responsible?: number;
  is_archived?: boolean;
  currency?: Currency;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  export?: 'xlsx' | 'pdf';
}

// Paginated response
export interface PaginatedPurchaseList {
  count: number;
  next?: string;
  previous?: string;
  results: Purchase[];
}