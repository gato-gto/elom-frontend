export type PageResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

export type Me = {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: 'admin' | 'buyer' | 'site_manager' | 'director' | 'coordinator';
};

export type Employee = {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: Me['role'];
};

export type Unit = {
    id: number;
    code: string;
    name: string;
};

export type Material = {
    id: number;
    name: string;
    sku?: string;
    category?: number;
    category_name?: string;
    default_unit: number;
    default_unit_code?: string;
    photo_url?: string | null;
    is_active?: boolean;
};

export type ObjectLite = {
    id: number;
    name: string;
    address?: string;
    is_active: boolean;
};

export type PurchaseItem = {
    id: number;
    material: number;
    material_name?: string;
    unit: number;
    unit_code?: string;
    quantity: string;
    price: string;
    amount: string;
    created_at: string;
    updated_at: string;
};

export type PurchasePhoto = {
    id: number;
    url: string;
    is_cover: boolean;
    mime?: string;
    size_bytes?: number;
    created_at?: string;
};

export type Purchase = {
    id: number;
    date: string; // YYYY-MM-DD
    object: number;
    object_name?: string;
    supplier?: string;
    invoice_number?: string;
    vat_included?: boolean;
    currency?: string;
    comment?: string;
    responsible?: number;
    responsible_name?: string;
    total_amount?: string;
    is_archived: boolean;
    cover_photo_url?: string | null;
    items: PurchaseItem[];
    photos: PurchasePhoto[];
    created_at: string;
    updated_at: string;
};

export type StockSnapshot = {
    id: number;
    date: string;
    object: number;
    object_name?: string;
    material: number;
    material_name?: string;
    unit: number;
    unit_code?: string;
    quantity: string;
    stage: 'after_rough' | 'after_handover';
    responsible: number;
    responsible_name?: string;
    comment?: string;
    is_archived: boolean;
    purchased_qty?: string | null;
    write_off_qty?: string | null;
    created_at: string;
    updated_at: string;
};

export type ArchivePeriod = {
    id: number;
    month: string; // "YYYY-MM-01"
    object: number;
    object_name?: string;
    closed_at: string;
    closed_by: number;
    closed_by_name?: string;
};

export interface Paginated<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ApiFieldErrors {
    [field: string]: string[] | undefined;
}

export interface ApiError {
    detail?: string;
    errors?: ApiFieldErrors;
}

export type Ordering = string;

export interface ListQuery {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: Ordering;
    default_unit?: number;
}
