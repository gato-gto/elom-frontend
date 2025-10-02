// ELOM API Types
// Generated from backend models and serializers

export type UserRole = 
  | "admin"
  | "director" 
  | "coordinator"
  | "brigadier"
  | "buyer"
  | "site_manager";

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


// ===== AUTHENTICATION =====

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface RefreshTokenRequest {
    refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface VerifyTokenRequest {
    token: string;
}

// ===== USER TYPES =====

export interface User {
  id: number;
    username: string;
  first_name: string;
  last_name: string;
  email: string;
    role: UserRole;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeCreateRequest {
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role: UserRole;
    assigned_object_ids?: number[];
    password?: string;
}

export interface EmployeeUpdateRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: UserRole;
    assigned_object_ids?: number[];
  is_active?: boolean;
}

export interface SetPasswordRequest {
    password: string;
}

// ===== COMMON TYPES =====

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

export interface SiteObject {
  id: number;
    name: string;
  address: string;
  is_active: boolean;
  lat?: string; // decimal as string
  lng?: string; // decimal as string
  location_url?: string;
  responsible?: number;
  responsible_name?: string;
  key_person_name?: string;
  key_person_contacts?: string;
  date_start?: string;
  date_end?: string;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type Object = SiteObject;

export interface AuditLog {
  id: number;
  ts: string;
  user?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  action_display: string;
  model: string;
  model_display: string;
  object_id: string;
  detail: string;
  ip?: string;
}

// ===== PURCHASE TYPES =====

export interface PurchaseItem {
  id: number;
  material: number;
    material_name: string;
  unit: number;
    unit_code: string;
  quantity: string; // decimal as string
  price?: string; // decimal as string, nullable
  amount: string; // decimal as string
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
  total_amount: string; // decimal as string
    is_archived: boolean;
    cover_photo_url?: string;
  purchase_no: string;
    status: 'new' | 'completed' | 'cancelled';
    items: PurchaseItem[];
    photos: PurchasePhoto[];
    created_at: string;
    updated_at: string;
}

export interface PurchaseCreateRequest {
    date: string;
  object: number;
    supplier: string;
    invoice_number?: string;
  currency: Currency;
    comment?: string;
  responsible: number;
    status?: 'new' | 'completed' | 'cancelled';
  items: PurchaseItemCreateRequest[];
}

export interface PurchaseUpdateRequest {
    date?: string;
  object?: number;
    supplier?: string;
    invoice_number?: string;
  currency?: Currency;
    comment?: string;
  responsible?: number;
    status?: 'new' | 'completed' | 'cancelled';
}

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

// ===== STOCK TYPES =====

export interface SmartQuantity {
    value: number;
    unit: string;
    original_value: number;
    original_unit: string;
    display_value?: number;
    display_unit?: string;
    conversion_applied?: boolean;
}

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

export interface WriteOffCreateRequest {
  date: string;
  object: number;
  material: number;
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

export interface StockSnapshotCreateRequest {
  date: string;
  object: number;
  material: number;
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

export interface ArchivePeriod {
  id: number;
    month: string;
  object: number;
    object_name: string;
    closed_at: string;
  closed_by: number;
  closed_by_name: string;
  is_closed: boolean;
}

export interface ClosePeriodRequest {
  object: number;
  month: string; // YYYY-MM
}

export interface ArchiveListQuery {
  object?: number;
  month?: string;
    is_closed?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface ArchivePeriodRequest {
  object: number;
    month: string;
}

// ===== REPORT TYPES =====

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

// ===== IMPORT TYPES =====

export interface ImportPrepareResponse {
  file_hash: string;
  headers: string[];
  preview: any[][];
  suggested_mapping: Record<string, string>;
}

export interface ImportDryRunRequest {
  file_hash: string;
  mapping: Record<string, string>;
}

export interface ImportDryRunResponse {
  valid_rows: number;
  invalid_rows: number;
  errors: string[];
  preview: any[][];
}

export interface ImportCommitRequest {
  file_hash: string;
  mapping: Record<string, string>;
  object_id: number;
  responsible_id: number;
}

export interface ImportCommitResponse {
  created_purchases: number;
  created_items: number;
  errors: string[];
}

// ===== API RESPONSE TYPES =====

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: string[] | string | undefined;
}

// ===== QUERY PARAMETERS =====

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

export interface PurchaseFilterParams extends PaginationParams, SearchParams, OrderingParams, DateFilterParams {
  object?: number;
  responsible?: number;
    is_archived?: boolean;
  currency?: Currency;
  material?: number;
  date_after?: string;
  date_before?: string;
}

export interface MaterialFilterParams extends PaginationParams, SearchParams, OrderingParams {
  category?: number;
  is_active?: boolean;
  default_unit?: number;
  page_size?: number;
}

export interface WriteOffFilterParams extends PaginationParams, SearchParams, OrderingParams, DateFilterParams {
  object?: number;
  material?: number;
  stage?: Stage;
  responsible?: number;
    is_archived?: boolean;
}

export interface StockSnapshotFilterParams extends PaginationParams, SearchParams, OrderingParams, DateFilterParams {
  object?: number;
  material?: number;
  stage?: Stage;
  source_type?: SourceType;
  source_id?: number;
  responsible?: number;
    is_archived?: boolean;
}

export interface ObjectFilterParams extends PaginationParams, SearchParams, OrderingParams {
  is_active?: boolean;
  responsible?: number;
  date_start?: string;
  date_end?: string;
  page_size?: number;
}

export interface EmployeeFilterParams extends PaginationParams, SearchParams, OrderingParams {
  role?: UserRole;
  is_active?: boolean;
  object?: number;
  page_size?: number;
}

export interface UnitFilterParams extends PaginationParams, SearchParams, OrderingParams {
  code?: string;
  name?: string;
  page_size?: number;
}

export interface ReportFilterParams extends DateFilterParams {
  object?: number;
  responsible?: number;
  material?: number;
  export?: 'xlsx' | 'pdf';
  ordering?: string;
}

// ===== FORM TYPES =====

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

export interface ObjectFormData {
  name: string;
  address: string;
  is_active: boolean;
  lat?: string; // decimal as string
  lng?: string; // decimal as string
  responsible?: number;
  date_start?: string;
  date_end?: string;
}

export interface EmployeeFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  assigned_object_ids: number[];
  password: string;
  is_active: boolean;
}

// ===== MISSING TYPES FOR COMPATIBILITY =====

// Employee types
export interface Employee {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  assigned_object_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  assigned_object_ids?: number[];
  password?: string;
  is_active?: boolean;
}

export interface PatchedEmployeeRequest {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: UserRole;
  assigned_object_ids?: number[];
  is_active?: boolean;
}

// Material request types
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

// Object request types
export interface ObjectRequest {
  name: string;
  address: string;
  is_active: boolean;
  location_url?: string;
  responsible?: number;
  date_start?: string;
  date_end?: string;
}

export interface PatchedObjectRequest {
  name?: string;
  address?: string;
  is_active?: boolean;
  location_url?: string;
  responsible?: number;
  date_start?: string;
  date_end?: string;
}

// Unit request types
export interface UnitRequest {
  code: string;
  name: string;
}

export interface PatchedUnitRequest {
  code?: string;
  name?: string;
}

// Purchase request types
export interface PurchaseRequest {
  date: string;
  object: number;
  supplier: number; // ID поставщика
  invoice_number?: string;
  purchase_no?: string;
  currency: Currency;
  comment?: string;
  responsible: number;
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

export interface PurchaseItemRequest {
  material: number;
  unit: number;
  quantity: string;
  price?: string;
  amount: string;
  _k?: string;
  total?: number;
}

// Material category types
export interface MaterialCategoryLite {
  id: number;
  name: string;
  parent?: number;
  parent_name?: string;
  children_count: number;
  materials_count: number;
  full_path: string;
}

// Pagination and response types
export interface PageResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
export interface PaginationState {
  count: number;
  page: number;
  pageSize: number;
  next: string | null | undefined;
  previous: string | null | undefined;
}

// Paginated list types
export interface PaginatedEmployeeList {
  count: number;
  next?: string;
  previous?: string;
  results: Employee[];
}

export interface PaginatedMaterialList {
  count: number;
  next?: string;
  previous?: string;
  results: Material[];
}

export interface PaginatedObjectList {
  count: number;
  next?: string;
  previous?: string;
  results: Object[];
}

export interface PaginatedPurchaseList {
  count: number;
  next?: string;
  previous?: string;
  results: Purchase[];
}

export interface PaginatedUnitList {
  count: number;
  next?: string;
  previous?: string;
  results: Unit[];
}

// Purchase filter types
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

// Report types
export interface MaterialReportRow {
  material_id: number;
  material_name: string;
  material_sku?: string;
  material_category: string;
  unit: string;
  qty_total: number;
  amount_total: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  rows: number;
}

export interface MaterialReportResponse {
  count: number;
  results: MaterialReportRow[];
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

// User/Me types
export interface Me {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  assigned_object_ids: number[];
}

// Photo upload types
export interface PurchasePhotoUploadRequest {
  photo: File;
  is_cover?: boolean;
  photo_type?: 'instructions' | 'report';
}

// ID type
export type ID = number;

// Notification type
export interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  is_read?: boolean;
  user_id?: number;
  related_type?: 'object' | 'material' | 'purchase' | 'stock';
  related_id?: number;
  action_url?: string;
}

// ===== SUPPLIERS =====

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

export interface PaginatedPurchaseSupplierList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PurchaseSupplier[];
}

export interface PurchaseSupplierListFilters {
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Алиасы для совместимости
export type Supplier = PurchaseSupplier;
export type SupplierCreateRequest = PurchaseSupplierCreateRequest;
export type SupplierUpdateRequest = PurchaseSupplierUpdateRequest;
export type SupplierFilterParams = PurchaseSupplierListFilters;
export type PaginatedSupplierList = PaginatedPurchaseSupplierList;

