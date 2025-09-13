export const API_PREFIX = (import.meta.env?.VITE_API_URL as string) || '/api/v1';

const join = (path: string) =>
    path.startsWith('/') ? `${API_PREFIX}${path}` : `${API_PREFIX}/${path}`;

export const endpoints = {
    health: join('/healthz'),

    auth: {
        token: join('/auth/token/'),
        refresh: join('/auth/token/refresh/'),
        verify: join('/auth/token/verify/'),
        me: join('/users/me'),
    },

    units: {
        list: join('/units/'),
        one: (id: number) => join(`/units/${id}/`),
    },

    materials: {
        list: join('/materials/'),
        one: (id: number) => join(`/materials/${id}/`),
        uploadPhoto: (id: number) => join(`/materials/${id}/photo/`),
    },

    // Допущение: список категорий материалов доступен по этому пути.
    // Если у бэкенда другой маршрут — заменим здесь в одном месте.
    materialCategories: join('/material-categories/'),

    objects: {
        list: join('/objects/'),
        one: (id: number) => join(`/objects/${id}/`),
    },

    employees: {
        list: join('/employees/'),
        one: (id: number) => join(`/employees/${id}/`),
    },

    purchases: {
        list: join('/purchases/'),
        one: (id: number) => join(`/purchases/${id}/`),
        uploadPhoto: (id: number) => join(`/purchases/${id}/photos/`),
        import: {
            prepare: join('/purchases/import/prepare'),
            dryRun: join('/purchases/import/dry_run'),
            commit: join('/purchases/import/commit'),
        },
    },

    stock: {
        snapshots: join('/stock/snapshots/'),
        one: (id: number) => join(`/stock/snapshots/${id}/`),
    },

    archive: {
        list: join('/archive/'),
        close: join('/archive/close/'),
        reopen: join('/archive/reopen/'),
        periods: join('/archive/periods/'),
    },

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
    materialsPhoto: (id: number) => join(`/materials/${id}/photo/`),
    purchasePhotos: (id: number) => join(`/purchases/${id}/photos/`),
} as const;

export type Query = | Record<string, string | number | boolean | Array<string | number> | undefined | null>;

export function buildQuery(params?: Query): string {
    if (!params) return '';
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) v.forEach((i) => q.append(k, String(i)));
        else q.set(k, String(v));
    });
    const s = q.toString();
    return s ? `?${s}` : '';
}

export default endpoints;
