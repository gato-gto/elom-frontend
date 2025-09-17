export const API_PREFIX = import.meta.env?.VITE_API_URL || '/api/v1';
const join = (path) => path.startsWith('/') ? `${API_PREFIX}${path}` : `${API_PREFIX}/${path}`;
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
        one: (id) => join(`/employees/${id}/`),
        setPassword: (id) => join(`/employees/${id}/set_password/`),
    },
    // Units endpoints
    units: {
        list: join('/units/'),
        one: (id) => join(`/units/${id}/`),
    },
    // Material Categories endpoints
    materialCategories: {
        list: join('/material-categories/'),
        one: (id) => join(`/material-categories/${id}/`),
    },
    // Materials endpoints
    materials: {
        list: join('/materials/'),
        one: (id) => join(`/materials/${id}/`),
        uploadPhoto: (id) => join(`/materials/${id}/photo/`),
    },
    // Objects endpoints
    objects: {
        list: join('/objects/'),
        one: (id) => join(`/objects/${id}/`),
    },
    // Purchases endpoints
    purchases: {
        list: join('/purchases/'),
        one: (id) => join(`/purchases/${id}/`),
        uploadPhoto: (id) => join(`/purchases/${id}/photos/`),
        import: {
            prepare: join('/purchases/import/prepare'),
            dryRun: join('/purchases/import/dry_run'),
            commit: join('/purchases/import/commit'),
        },
    },
    // Stock Snapshots endpoints
    stockSnapshots: {
        list: join('/stock/snapshots/'),
        one: (id) => join(`/stock/snapshots/${id}/`),
    },
    // Archive endpoints
    archive: {
        list: join('/archive/'),
        one: (id) => join(`/archive/${id}/`),
        close: join('/archive/close/'),
        reopen: join('/archive/reopen/'),
        periods: {
            list: join('/archive/periods/'),
            one: (id) => join(`/archive/periods/${id}/`),
            close: join('/archive/periods/close/'),
            reopen: join('/archive/periods/reopen/'),
        },
    },
    // Reports endpoints
    reports: {
        byPeriod: join('/reports/purchases/by-period'),
        byObject: join('/reports/purchases/by-object'),
        byResponsible: join('/reports/purchases/by-responsible'),
        byMaterial: join('/reports/purchases/by-material'),
    },
    // ---------- Алиасы совместимости со старым кодом ----------
    common: {
        units: join('/units/'),
        objects: join('/objects/'),
        employees: join('/employees/'),
        materials: join('/materials/'),
    },
    // Старые имена, которые использовались в коде:
    materialsPhoto: (id) => join(`/materials/${id}/photo/`),
    purchasePhotos: (id) => join(`/purchases/${id}/photos/`),
};
export function buildQuery(params) {
    if (!params)
        return '';
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null)
            return;
        if (Array.isArray(v))
            v.forEach((i) => q.append(k, String(i)));
        else
            q.set(k, String(v));
    });
    const s = q.toString();
    return s ? `?${s}` : '';
}
export default endpoints;
