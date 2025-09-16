// src/api/types.ts
// Строгие DTO для фронта. Соответствуют YAML/MD спецификации проекта.

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
export interface TokenPair {
    access: string;
    refresh: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface TokenRefreshRequest {
    refresh: string;
}

export interface TokenVerifyRequest {
    token: string;
}

export interface MeResponse {
    id: ID;
    username: string;
    email?: string | null;
    role?: UserRole | null;
}

// -------------------- Employees/Users --------------------
export type UserRole =
    | "admin"
    | "buyer"
    | "site_manager"
    | "director"
    | "coordinator";

export interface EmployeeListItem {
    id: ID;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: UserRole;
    is_active: boolean;
}

export interface EmployeeDetail extends EmployeeListItem {
    is_staff: boolean;
    is_superuser: boolean;
    date_joined?: string; // ISO
    last_login?: string | null; // ISO
}

export interface EmployeeCreate {
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: UserRole;
    is_active?: boolean;
    password?: string; // может быть задан при создании
}

export interface EmployeeUpdate {
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: UserRole;
    is_active?: boolean;
}

export interface SetPasswordRequest {
    password: string;
}

// -------------------- Units --------------------
export interface Unit {
    id: ID;
    name: string;
    code?: string | null;
    is_active: boolean;
}

export interface UnitCreate {
    name: string;
    code?: string | null;
    is_active?: boolean;
}

export interface UnitUpdate extends UnitCreate {
}

// -------------------- Objects --------------------
export interface SiteObject {
    id: ID;
    name: string;
    address?: string | null;
    lat?: number | null;
    lon?: number | null;
    responsible_name?: string | null;
    responsible_phone?: string | null;
    start_date?: string | null; // ISO
    end_date?: string | null;   // ISO
    notes?: string | null;
    is_active: boolean;
}

export interface ObjectCreate extends Partial<SiteObject> {
    name: string;
}

export interface ObjectUpdate extends Partial<ObjectCreate> {
}

// -------------------- Materials --------------------
export interface Material {
    id: ID;
    name: string;
    unit: ID;              // ссылка на Unit
    unit_name?: string;    // опционально возвращается беком
    code?: string | null;
    is_active: boolean;
    photo_url?: string | null;
}

export interface MaterialCreate {
    name: string;
    unit: ID;
    code?: string | null;
    is_active?: boolean;
    // photo: multipart на уровне запроса (FormData)
}

export interface MaterialUpdate extends Partial<MaterialCreate> {
}

// -------------------- Purchases --------------------
export interface PurchaseItemIn {
    material: ID;
    quantity: number;    // в базовой еденице unit материала
    unit?: ID;           // если бек поддерживает явный unit у позиции
    price?: number | null; // опционально
}

export interface PurchaseItem extends PurchaseItemIn {
    id: ID;
    material_name?: string;
    unit_name?: string;
    amount?: number | null; // сумма = quantity * price (если сервер считает)
}

export interface PurchasePhoto {
    id: ID;
    url: string;
    description?: string | null;
}

export interface PurchaseBase {
    date: string;           // ISO (YYYY-MM-DD)
    object: ID;             // объект
    supplier?: string | null;
    invoice_number?: string | null;
    currency?: "UZS";       // MVP
    vat_included?: boolean; // флаг НДС
    comment?: string | null;
    responsible?: ID | null; // бригадир/ответственный
}

export interface PurchaseCreate extends PurchaseBase {
    items: PurchaseItemIn[];     // позиции
    // photo_main?: multipart в форме (FormData)
    // photos_extra[]?: multipart массив
}

export interface Purchase extends PurchaseBase {
    id: ID;
    items: PurchaseItem[];
    photo_main_url?: string | null;
    photos?: PurchasePhoto[];
    created_at?: string; // ISO
    updated_at?: string; // ISO
}

export interface PurchaseUpdate extends Partial<PurchaseCreate> {
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

// -------------------- Stocks (snapshots) --------------------
export interface StockSnapshotCreate {
    date: string;      // YYYY-MM-DD
    object: ID;
    material: ID;
    quantity_actual: number;
    responsible?: ID | null;
}

export interface StockSnapshot extends StockSnapshotCreate {
    id: ID;
    unit?: ID;
    unit_name?: string;
    created_at?: string;
    updated_at?: string;
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
    month: string;   // YYYY-MM
    object: ID;
    object_name?: string;
    is_closed: boolean;
    closed_at?: string | null;
    reopened_at?: string | null;
}

export interface ArchiveCloseRequest {
    month: string; // YYYY-MM
    object: ID;
}

export interface ArchiveReopenRequest extends ArchiveCloseRequest {
}

export interface ArchiveListQuery {
    month?: string; // YYYY-MM
    object?: ID;
    responsible?: ID;
    page?: number;
    page_size?: number;
}

// -------------------- Reports --------------------
export interface ReportCommonQuery {
    month?: string;    // YYYY-MM
    from?: string;     // YYYY-MM-DD
    to?: string;       // YYYY-MM-DD
    object?: ID;
    responsible?: ID;
    material?: ID;
    export?: "xlsx";
    page?: number;
    page_size?: number;
}

export interface ReportRow {
    // универсальная строка отчёта (поле-супермножество)
    date?: string;           // YYYY-MM-DD
    object?: string;
    object_id?: ID;
    responsible?: string;
    responsible_id?: ID;
    material?: string;
    material_id?: ID;
    unit_name?: string;
    quantity?: number;
    amount?: number | null;  // при наличии цены
}

// Для страниц: отчёты могут возвращать массив строк или пагинацию.
export type ReportResponse = PageResponse<ReportRow> | ReportRow[];
