// Authentication and user types

import type { UserRole } from './common';

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
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  assigned_object_ids: number[];
}

export interface SetPasswordRequest {
  password: string;
}

