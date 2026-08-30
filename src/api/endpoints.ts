export const API_PREFIX = (import.meta.env?.VITE_API_URL as string) || '/api/v1';

const join = (path: string) =>
    path.startsWith('/') ? `${API_PREFIX}${path}` : `${API_PREFIX}/${path}`;

export const endpoints = {
    // Auth endpoints
    auth: {
        token: join('/auth/token/'),
        refresh: join('/auth/token/refresh/'),
    },

    // User endpoints
    users: {
        me: join('/users/me'),
        mePassword: join('/users/me/password'),  // F-1021 self-service смена пароля (BE F-777)
    },

    // RBAC endpoints
    rbac: {
        myPermissions: join('/rbac/my-permissions/'),
        permissions: {
            list: join('/rbac/permissions/'),
        },
        roles: {
            list: join('/rbac/roles/'),
            one: (id: number) => join(`/rbac/roles/${id}/`),
            create: join('/rbac/roles/'),
            update: (id: number) => join(`/rbac/roles/${id}/`),
            delete: (id: number) => join(`/rbac/roles/${id}/`),
        },
        userRoles: {
            list: join('/rbac/user-roles/'),
            create: join('/rbac/user-roles/'),
            delete: (id: number) => join(`/rbac/user-roles/${id}/`),
        },
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
        search: join('/materials/search/'),
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
        deletePhoto: (id: number, photoId: number) => join(`/purchases/${id}/photos/${photoId}/`),
        // F-1025: блок import.{prepare,dryRun,commit} удалён — 0 FE-вызовов (BE-эндпоинты живы; вернуть при появлении UI).
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
    },

    // WriteOff endpoints
    writeOffs: {
        list: join('/writeoffs/'),
        one: (id: number) => join(`/writeoffs/${id}/`),
        fromBalanceBulk: join('/writeoffs/from-balance-bulk/'),
        bulkCreate: join('/writeoffs/bulk-create/'), // F-270: атомарное массовое «Новое списание»
    },

    // Archive periods (закрытие/открытие месяца×объекта)
    archivePeriods: {
        list: join('/archive/periods/'),
        close: join('/archive/periods/close/'),
        reopen: join('/archive/periods/reopen/'),
    },

    // Tools endpoints
    tools: {
        list: join('/tools/'),
        one: (id: number) => join(`/tools/${id}/`),
        categories: join('/tools/categories/'),
        bulkCreate: join('/tools/bulk-create/'),
    },

    // Tool Issues endpoints
    toolIssues: {
        list: join('/tool-issues/'),
        one: (id: number) => join(`/tool-issues/${id}/`),
        issue: join('/tool-issues/issue/'),
        returnTool: (id: number) => join(`/tool-issues/${id}/return/`),
        // backend action is `active`, not `open-issues` (F-055)
        openIssues: join('/tool-issues/active/'),
    },

    // Reports endpoints
    reports: {
        byPeriod: join('/reports/purchases/by-period/'),
        byObject: join('/reports/purchases/by-object/'),
        byResponsible: join('/reports/purchases/by-responsible/'),
        byMaterial: join('/reports/purchases/by-material/'),
    },

    // Estimates (смета по объекту / отчёт цен) — этап 1
    workCategories: {
        list: join('/work-categories/'),
        one: (id: number) => join(`/work-categories/${id}/`),
    },
    workItems: {
        list: join('/work-items/'),
        one: (id: number) => join(`/work-items/${id}/`),
        search: join('/work-items/search/'),
    },
    // F-1036 (BE F-794): пресеты коэффициентов для диалога «+ Добавить коэффициент» (справочник руководства)
    coefficientPresets: {
        list: join('/coefficient-presets/'),
        one: (id: number) => join(`/coefficient-presets/${id}/`),
    },
    estimates: {
        list: join('/estimates/'),
        one: (id: number) => join(`/estimates/${id}/`),
        // F-997 (импорт «отчёта цен», BE F-766): 2-шаговый multipart POST file → dry-run/commit.
        importDryRun: join('/estimates/import/dry-run/'),
        importCommit: join('/estimates/import/commit/'),
    },

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
