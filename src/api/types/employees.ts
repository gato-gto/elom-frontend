// Employee types

import type {UserRole, PaginationParams, SearchParams, OrderingParams} from './common';

export interface Employee {
    id: number;
    profile_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    // ✅ Поле role удалено - используйте roles (RBAC)
    roles?: Array<{  // ✅ RBAC роли
        id: number;
        name: string;
        display_name: string;
    }>;
    phone: string;
    is_active: boolean;
    assigned_object_ids: number[];
    created_at: string;
    updated_at: string;
}

export interface EmployeeCreateRequest {
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    // ✅ Поле role удалено - роли назначаются через RBAC API
    phone?: string;
    assigned_object_ids?: number[];
    password?: string;
}

export interface EmployeeUpdateRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    // ✅ Поле role удалено - роли обновляются через RBAC API
    phone?: string;
    assigned_object_ids?: number[];
    is_active?: boolean;
}

export interface EmployeeRequest {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    // ✅ Поле role удалено - роли назначаются через RBAC API (/rbac/user-roles/)
    roles?: number[]; // ✅ RBAC: Массив ID ролей для назначения через отдельный API
    phone?: string;
    assigned_object_ids?: number[];
    password?: string;
    is_active?: boolean;
}

export interface PatchedEmployeeRequest {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    // ✅ Поле role удалено - роли обновляются через RBAC API
    phone?: string;
    assigned_object_ids?: number[];
    is_active?: boolean;
}

export interface EmployeeFormData {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    // ✅ Поле role удалено - используйте roles (массив ID)
    phone: string;
    assigned_object_ids: number[];
    password: string;
    is_active: boolean;
}

// Filter parameters
export interface EmployeeFilterParams extends PaginationParams, SearchParams, OrderingParams {
    // ✅ Фильтр по role удален - поле role удалено из модели
    // TODO: Можно добавить фильтр по RBAC ролям через user_roles__role__name
    is_active?: boolean;
    object?: number;
    page_size?: number;
}

// Paginated response
export interface PaginatedEmployeeList {
    count: number;
    next?: string;
    previous?: string;
    results: Employee[];
}

// User types for authentication
export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    // ✅ Поле role удалено - используйте roles (RBAC)
    roles?: Array<{
        id: number;
        name: string;
        display_name: string;
    }>;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Me {
    id: number;
    profile_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    // ✅ Поле role удалено - используйте roles (RBAC)
    roles?: Array<{  // Роли из RBAC (только для отображения в UI!)
        id: number;
        name: string;
        display_name: string;
    }>;
    is_superuser?: boolean;  // ✅ Добавлено поле is_superuser
    is_active: boolean;
    assigned_object_ids: number[];
}