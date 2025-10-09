export const API_PREFIX = (import.meta.env?.VITE_API_URL as string) || '/api/v1';

const join = (path: string) =>
    path.startsWith('/') ? `${API_PREFIX}${path}` : `${API_PREFIX}/${path}`;

export const endpoints = {
    // Health check (если есть)
    health: join('/health'),

    // Auth endpoints
    auth: {
        token: join('/auth/token/'),
        refresh: join('/auth/token/refresh/'),
        verify: join('/auth/token/verify/'),
    },

    // User endpoints
    users: {
        me: join('/users/me'),
    },

    // Employee endpoints
    employees: {
        list: join('/employees/'),
        one: (id: number) => join(`/employees/${id}/`),
        setPassword: (id: number) => join(`/employees/${id}/set_password/`),
    },

    // Units endpoints
    units: {
        list: join('/units/'),
        one: (id: number) => join(`/units/${id}/`),
    },


    // Material Categories endpoints
    materialCategories: {
        list: join('/material-categories/'),
        one: (id: number) => join(`/material-categories/${id}/`),
    },

    // Materials endpoints
    materials: {
        list: join('/materials/'),
        one: (id: number) => join(`/materials/${id}/`),
        uploadPhoto: (id: number) => join(`/materials/${id}/upload-photo/`),
        deletePhoto: (id: number) => join(`/materials/${id}/photo/`),
        // Новые endpoints
        lite: join('/materials/lite/'),
        search: join('/materials/search/'),
        stats: join('/materials/stats/'),
        bulkUpdate: join('/materials/bulk-update/'),
        byObject: join('/materials/by-object/'),
    },

    // Objects endpoints
    objects: {
        list: join('/objects/'),
        one: (id: number) => join(`/objects/${id}/`),
        responsibles: join('/objects/responsibles/'),
    },

    // Purchases endpoints
    purchases: {
        list: join('/purchases/'),
        one: (id: number) => join(`/purchases/${id}/`),
        uploadPhoto: (id: number) => join(`/purchases/${id}/photos/upload/`),
        bulkUploadPhotos: (id: number) => join(`/purchases/${id}/photos/bulk-upload/`),
        getPhotos: (id: number) => join(`/purchases/${id}/photos/`),
        updatePhoto: (id: number, photoId: number) => join(`/purchases/${id}/photos/${photoId}/`),
        deletePhoto: (id: number, photoId: number) => join(`/purchases/${id}/photos/${photoId}/`),
        setCoverPhoto: (id: number, photoId: number) => join(`/purchases/${id}/photos/${photoId}/set-cover/`),
        reorderPhotos: (id: number) => join(`/purchases/${id}/photos/reorder/`),
        import: {
            prepare: join('/purchases/import/prepare'),
            dryRun: join('/purchases/import/dry_run'),
            commit: join('/purchases/import/commit'),
        },
    },

    // Suppliers endpoints
    suppliers: {
        list: join('/suppliers/'),
        one: (id: number) => join(`/suppliers/${id}/`),
    },

    // Stock Snapshots endpoints
    stockSnapshots: {
        list: join('/stock/snapshots/'),
        one: (id: number) => join(`/stock/snapshots/${id}/`),
        balance: join('/stock/snapshots/balance/'),
        byObjects: join('/stock/snapshots/by-objects/'),
        history: join('/stock/snapshots/history/'),
    },

    // WriteOff endpoints
    writeOffs: {
        list: join('/writeoffs/'),
        one: (id: number) => join(`/writeoffs/${id}/`),
    },

    // Archive endpoints
    archive: {
        list: join('/archive/'),
        one: (id: number) => join(`/archive/${id}/`),
        close: join('/archive/close/'),
        reopen: join('/archive/reopen/'),
        periods: {
            list: join('/archive/periods/'),
            one: (id: number) => join(`/archive/periods/${id}/`),
            close: join('/archive/periods/close/'),
            reopen: join('/archive/periods/reopen/'),
        },
    },

    // Reports endpoints
    reports: {
        byPeriod: join('/reports/purchases/by-period/'),
        byObject: join('/reports/purchases/by-object/'),
        byResponsible: join('/reports/purchases/by-responsible/'),
        byMaterial: join('/reports/purchases/by-material/'),
    },

    // ---------- Алиасы совместимости со старым кодом ----------
    common: {
        units: join('/units/'),
        objects: join('/objects/'),
        employees: join('/employees/'),
        materials: join('/materials/'),
    },
    // Старые имена, которые использовались в коде:
    materialsPhoto: (id: number) => join(`/materials/${id}/photo/`),
    purchasePhotos: (id: number) => join(`/purchases/${id}/photos/`),
} as const;

export type Query = | Record<string, string | number | boolean | Array<string | number> | undefined | null>;

export function buildQuery(params?: Query): string {
    if (!params) { return ''; }
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null) { return; }
        // Не добавляем пустые строки для boolean параметров
        if (typeof v === 'boolean') {
            q.set(k, String(v));
        } else if (Array.isArray(v)) {
            v.forEach((i) => q.append(k, String(i)));
        } else if (String(v).trim() !== '') {
            q.set(k, String(v));
        }
    });
    const s = q.toString();
    return s ? `?${s}` : '';
}

export default endpoints;
