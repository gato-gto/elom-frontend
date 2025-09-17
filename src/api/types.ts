// src/api/types.ts
// Строгие DTO для фронта. Соответствуют OpenAPI схеме ELOM API v1.0.0

export type ID = number;

// Общие формы пагинации DRF (PageNumberPagination)
export interface PageMeta {
    count: number;
    next: string | null;
    previous: string | null;
}

export interface PageResponse<T> extends PageMeta {
    results: T[];
}

// -------------------- Auth --------------------
export interface TokenObtainPair {
    access: string;
    refresh: string;
}

export interface TokenObtainPairRequest {
    username: string;
    password: string;
}

export interface TokenRefresh {
    access: string;
    refresh: string;
}

export interface TokenRefreshRequest {
    refresh: string;
}

export interface TokenVerifyRequest {
    token: string;
}

export interface Me {
    id: ID;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
}

// -------------------- Employees/Users --------------------
export type UserRole = "admin" | "buyer" | "site_manager" | "director" | "coordinator";

export interface Employee {
    id: ID;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    is_active: boolean;
    role: UserRole;
    assigned_object_ids: number[];
}

export interface EmployeeRequest {
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    is_active?: boolean;
    role: UserRole;
    assigned_object_ids?: number[];
    password?: string;
}

export interface PatchedEmployeeRequest {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    is_active?: boolean;
    role?: UserRole;
    assigned_object_ids?: number[];
    password?: string;
}

export interface SetPasswordRequest {
    password: string;
}

// -------------------- Units --------------------
export interface Unit {
    id: ID;
    code: string;
    name: string;
}

export interface UnitRequest {
    code: string;
    name: string;
}

export interface PatchedUnitRequest {
    code?: string;
    name?: string;
}

// -------------------- Objects --------------------
export interface Object {
    id: ID;
    name: string;
    address?: string;
    is_active: boolean;
}

export interface ObjectRequest {
    name: string;
    address?: string;
    is_active?: boolean;
}

export interface PatchedObjectRequest {
    name?: string;
    address?: string;
    is_active?: boolean;
}

// Type alias for compatibility with existing code
export type SiteObject = Object;

// -------------------- Materials --------------------
export interface Material {
    id: ID;
    name: string;
    sku?: string;
    category?: ID;
    category_name?: string;
    default_unit: ID;
    default_unit_code?: string;
    photo_url?: string;
    is_active?: boolean;
}

export interface MaterialRequest {
    name: string;
    sku?: string;
    category?: ID;
    default_unit: ID;
}

export interface PatchedMaterialRequest {
    name?: string;
    sku?: string;
    category?: ID;
    default_unit?: ID;
}

export interface MaterialPhotoUploadRequest {
    photo: File;
}

// -------------------- Material Categories --------------------
export interface MaterialCategoryLite {
    id: ID;
    name: string;
    parent?: ID;
}

export interface MaterialCategoryLiteRequest {
    name: string;
    parent?: ID;
}

export interface PatchedMaterialCategoryLiteRequest {
    name?: string;
    parent?: ID;
}

// -------------------- Purchases --------------------
export interface PurchaseItem {
    id: ID;
    material: ID;
    material_name: string;
    unit: ID;
    unit_code: string;
    quantity: string;
    price?: string;
    amount: string;
    created_at: string;
    updated_at: string;
}

export interface PurchaseItemRequest {
    material: ID;
    unit: ID;
    quantity: string;
    price?: string;
    amount?: string;
}

// Type alias for compatibility with existing code
export type PurchaseItemIn = PurchaseItemRequest;

export interface PurchasePhoto {
    id: ID;
    url: string;
    is_cover: boolean;
    mime?: string;
    size_bytes?: number;
    created_at: string;
}

export interface PurchasePhotoRequest {
    is_cover?: boolean;
    mime?: string;
    size_bytes?: number;
}

export interface PurchasePhotoUploadRequest {
    photo: File;
    is_cover?: boolean;
}

export interface Purchase {
    id: ID;
    date: string;
    object: ID;
    object_name: string;
    supplier: string;
    invoice_number?: string;
    vat_included: boolean;
    currency: string;
    comment?: string;
    responsible: ID;
    responsible_name: string;
    total_amount: string;
    is_archived: boolean;
    cover_photo_url?: string;
    items: PurchaseItem[];
    photos: PurchasePhoto[];
    created_at: string;
    updated_at: string;
}

export interface PurchaseRequest {
    date: string;
    object: ID;
    supplier: string;
    invoice_number?: string;
    vat_included?: boolean;
    currency?: string;
    comment?: string;
    responsible: ID;
    total_amount?: string;
    is_archived?: boolean;
    items: PurchaseItemRequest[];
}

// Type aliases for compatibility with existing code
export type PurchaseCreate = PurchaseRequest;
export type PurchaseUpdate = PatchedPurchaseRequest;

export interface PatchedPurchaseRequest {
    date?: string;
    object?: ID;
    supplier?: string;
    invoice_number?: string;
    vat_included?: boolean;
    currency?: string;
    comment?: string;
    responsible?: ID;
    total_amount?: string;
    is_archived?: boolean;
    items?: PurchaseItemRequest[];
}

export interface PurchaseListFilters {
    date_after?: string;      // YYYY-MM-DD
    date_before?: string;     // YYYY-MM-DD
    object?: ID;
    material?: ID;
    responsible?: ID;
    search?: string;
    ordering?: string;        // e.g. "-date"
    page?: number;
    page_size?: number;
    is_archived?: boolean;    // если фильтр поддерживается
}

export interface PurchaseExportQuery extends PurchaseListFilters {
    export: "xlsx";
}

// -------------------- Purchases: Import --------------------
export type ImportHash = string;

export interface ImportPrepareRequest {
    file: File;          // фронт отправит multipart
    sheet?: string;      // имя листа
}

export interface ImportPrepareResponse {
    ok: boolean;
    sheets: string[];      // список распознанных листов
    columns?: string[];    // если удалось извлечь заголовки
    hash: ImportHash;
    warnings?: string[];
}

export interface ImportMapping {
    // отображение колонок файла -> поля системы
    // Например: { "Дата": "date", "Объект": "object", "Материал": "material", ... }
    [fileColumn: string]: string;
}

export interface ImportDryRunRequest {
    hash: ImportHash;
    mapping: ImportMapping;
    sheet?: string;
}

export interface ImportDryRunRowError {
    row: number;
    field: string;
    message: string;
    value?: unknown;
}

export interface ImportDryRunResponse {
    ok: boolean;
    rows_total: number;
    rows_valid: number;
    rows_invalid: number;
    errors: ImportDryRunRowError[];
    warnings?: string[];
    hash: ImportHash;
}

export interface ImportCommitRequest {
    hash: ImportHash;
}

export interface ImportCommitResponse {
    imported: number;
    skipped: number;
    hash: ImportHash;
}

// -------------------- Stock Snapshots --------------------
export type StageEnum = "after_rough" | "after_handover";

export interface StockSnapshot {
    id: ID;
    date: string;
    object: ID;
    object_name: string;
    material: ID;
    material_name: string;
    unit: ID;
    unit_code: string;
    quantity: string;
    stage: StageEnum;
    responsible: ID;
    comment?: string;
    is_archived: boolean;
    purchased_qty: string;
    write_off_qty: string;
    created_at: string;
    updated_at: string;
}

export interface StockSnapshotRequest {
    date: string;
    object: ID;
    material: ID;
    unit: ID;
    quantity: string;
    stage: StageEnum;
    responsible: ID;
    comment?: string;
    is_archived?: boolean;
}

export interface PatchedStockSnapshotRequest {
    date?: string;
    object?: ID;
    material?: ID;
    unit?: ID;
    quantity?: string;
    stage?: StageEnum;
    responsible?: ID;
    comment?: string;
    is_archived?: boolean;
}

export interface StockListFilters {
    date_after?: string;
    date_before?: string;
    object?: ID;
    material?: ID;
    responsible?: ID;
    page?: number;
    page_size?: number;
    is_archived?: boolean;
}

export interface StockSummaryQuery {
    month: string; // YYYY-MM
    object?: ID;
    material?: ID;
}

export interface StockSummaryItem {
    material: ID;
    material_name?: string;
    purchased: number; // закуплено за период
    actual: number;    // остаток факт
    writeoff: number;  // списание = purchased - actual
    unit_name?: string;
}

// -------------------- Archive --------------------
export interface ArchivePeriod {
    id: ID;
    month: string;
    object: ID;
    object_name: string;
    closed_at: string;
    closed_by: ID;
    closed_by_name?: string;
    is_closed?: boolean;
}

export interface ArchivePeriodRequest {
    month: string;
    object: ID;
}

export interface ArchiveListQuery {
    month?: string; // YYYY-MM
    object?: ID;
    responsible?: ID;
    page?: number;
    page_size?: number;
}

// -------------------- Reports --------------------
export interface ReportByMaterialQuery {
    date_from?: string;
    date_to?: string;
    export?: "pdf" | "xlsx";
    is_archived?: boolean;
    material?: ID;
    object?: ID[];
    responsible?: ID;
}

export interface ReportByObjectQuery {
    date_from?: string;
    date_to?: string;
    export?: "pdf" | "xlsx";
    is_archived?: boolean;
    object?: ID[];
    responsible?: ID;
}

export interface ReportByPeriodQuery {
    date_from?: string;
    date_to?: string;
    export?: "pdf" | "xlsx";
    is_archived?: boolean;
    object?: ID[];
    period?: "day" | "month";
    responsible?: ID;
}

export interface ReportByResponsibleQuery {
    date_from?: string;
    date_to?: string;
    export?: "pdf" | "xlsx";
    is_archived?: boolean;
    object?: ID[];
    responsible?: ID;
}

export interface ReportResponse {
    rows: (string | number | null)[][];
}

// -------------------- Paginated Lists --------------------
export interface PaginatedUnitList extends PageResponse<Unit> {}
export interface PaginatedObjectList extends PageResponse<Object> {}
export interface PaginatedMaterialList extends PageResponse<Material> {}
export interface PaginatedMaterialCategoryLiteList extends PageResponse<MaterialCategoryLite> {}
export interface PaginatedEmployeeList extends PageResponse<Employee> {}
export interface PaginatedPurchaseList extends PageResponse<Purchase> {}
export interface PaginatedStockSnapshotList extends PageResponse<StockSnapshot> {}
export interface PaginatedArchivePeriodList extends PageResponse<ArchivePeriod> {}
