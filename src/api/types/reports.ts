// Report types

import type { DateFilterParams } from './common';

export interface ObjectReportItem {
  object_id: number;
  object_name: string;
  object_address: string;
  object_is_active: boolean;
  first_purchase_date?: string;
  last_purchase_date?: string;
  purchases: number;
  total_amount: number;
  unique_materials: number;
  unique_responsibles: number;
}

export interface ResponsibleReportItem {
  responsible_id: number;
  responsible_name: string;
  responsible_username: string;
  responsible_email: string;
  purchases: number;
  total_amount: number;
  unique_objects: number;
  unique_materials: number;
}

export interface MaterialReportItem {
  material_id: number;
  material_name: string;
  material_sku?: string;
  material_category: string;
  unit: string;
  // Дополнительные поля материала
  material_description: string;
  material_manufacturer: string;
  material_is_active: boolean;
  material_created_date: string | null;
  material_average_price: number | null;
  material_min_stock_level: null;
  // Основные поля отчета
  qty_total: number | null;  // может быть null если нет конвертации единиц
  amount_total: number;
  avg_price: number;
  min_price: number | null;  // может быть null
  max_price: number | null;  // может быть null
  rows: number;
  // Дополнительные поля
  unique_objects: number;
  unique_responsibles: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
}

// Report response types
export interface MaterialReportRow {
  material_id: number;
  material_name: string;
  material_sku?: string;
  material_category: string;
  unit: string;
  // Дополнительные поля материала
  material_description: string;
  material_manufacturer: string;
  material_is_active: boolean;
  material_created_date: string | null;
  material_average_price: number | null;
  material_min_stock_level: null;
  // Основные поля отчета
  qty_total: number | null;  // может быть null если нет конвертации единиц
  amount_total: number;
  avg_price: number;
  min_price: number | null;  // может быть null
  max_price: number | null;  // может быть null
  rows: number;
  // Дополнительные поля
  unique_objects: number;
  unique_responsibles: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
}

// F-721: агрегат сводки по ВСЕМУ отфильтрованному отчёту (не по странице). BE отдаёт рядом с results.
export interface MaterialReportGrandTotal {
  amount_total: number;
  rows: number;
  rows_count: number;
  avg_amount: number;
}
export interface AmountReportGrandTotal {
  total_amount: number;
  purchases: number;
  rows_count: number;
  avg_amount: number;
}

export interface MaterialReportResponse {
  count: number;
  results: MaterialReportRow[];
  grand_total?: MaterialReportGrandTotal; // F-721
}

export interface ObjectReportRow {
  object_id: number;
  object_name: string;
  object_address: string;
  object_is_active: boolean;
  first_purchase_date?: string;
  last_purchase_date?: string;
  purchases: number;
  total_amount: number;
  unique_materials: number;
  unique_responsibles: number;
}

export interface ObjectReportResponse {
  count: number;
  results: ObjectReportRow[];
  grand_total?: AmountReportGrandTotal; // F-721
}

export interface PeriodReportRow {
  period: string;
  purchases: number;
  total_amount: number;
  unique_objects: number;
  unique_materials: number;
  unique_responsibles: number;
  avg_amount?: number;
}

export interface PeriodReportResponse {
  count: number;
  results: PeriodReportRow[];
  grand_total?: AmountReportGrandTotal; // F-721
}

export interface ResponsibleReportRow {
  responsible_id: number;
  responsible_name: string;
  responsible_username: string;
  responsible_email: string;
  purchases: number;
  total_amount: number;
  unique_objects: number;
  unique_materials: number;
}

export interface ResponsibleReportResponse {
  count: number;
  results: ResponsibleReportRow[];
  grand_total?: AmountReportGrandTotal; // F-721
}

// Report query types
export interface ReportFilterParams extends DateFilterParams {
  object?: number;
  responsible?: number;
  material?: number;
  export?: 'xlsx' | 'pdf';
  ordering?: string;
}

export interface ReportByMaterialQuery {
  object?: number | number[];
  material?: number;
  date_from?: string;
  date_to?: string;
  export?: 'xlsx' | 'pdf';
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | (string | number)[] | null | undefined;
}

export interface ReportByObjectQuery {
  object?: number | number[];
  responsible?: number;
  date_from?: string;
  date_to?: string;
  export?: 'xlsx' | 'pdf';
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | (string | number)[] | null | undefined;
}

export interface ReportByPeriodQuery {
  object?: number;
  responsible?: number;
  date_from?: string;
  date_to?: string;
  export?: 'xlsx' | 'pdf';
  ordering?: string;
  period?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | (string | number)[] | null | undefined;
}

export interface ReportByResponsibleQuery {
  object?: number;
  responsible?: number;
  date_from?: string;
  date_to?: string;
  export?: 'xlsx' | 'pdf';
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | (string | number)[] | null | undefined;
}

