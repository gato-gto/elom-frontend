// Employee types

import type {UserRole, PaginationParams, SearchParams, OrderingParams} from './common';

export interface Employee {
    id: number;
    profile_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
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
    role: UserRole;
    phone?: string;
    assigned_object_ids?: number[];
    password?: string;
}

export interface EmployeeUpdateRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: UserRole;
    phone?: string;
    assigned_object_ids?: number[];
    is_active?: boolean;
}

export interface EmployeeRequest {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
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
    role?: UserRole;
    phone?: string;
    assigned_object_ids?: number[];
    is_active?: boolean;
}

export interface EmployeeFormData {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    phone: string;
    assigned_object_ids: number[];
    password: string;
    is_active: boolean;
}

// Filter parameters
export interface EmployeeFilterParams extends PaginationParams, SearchParams, OrderingParams {
    role?: UserRole;
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
    role: UserRole;
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
    role: UserRole;
    is_active: boolean;
    assigned_object_ids: number[];
}