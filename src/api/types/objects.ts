// Object types

import type { PaginationParams, SearchParams, OrderingParams } from './common';

export interface SiteObject {
  id: number;
  name: string;
  address: string;
  is_active: boolean;
  lat?: string; // decimal as string
  lng?: string; // decimal as string
  location_url?: string;
  responsible?: number;
  responsible_name?: string;
  current_stage: string;
  current_stage_display?: string;
  key_person_name?: string;
  key_person_contacts?: string;
  date_start?: string;
  date_end?: string;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type Object = SiteObject;

export interface ObjectRequest {
  name: string;
  address: string;
  is_active: boolean;
  location_url?: string;
  responsible?: number;
  current_stage?: string;
  key_person_name?: string;
  key_person_contacts?: string;
  date_start?: string;
  date_end?: string;
}

export interface PatchedObjectRequest {
  name?: string;
  address?: string;
  is_active?: boolean;
  location_url?: string;
  responsible?: number;
  current_stage?: string;
  key_person_name?: string;
  key_person_contacts?: string;
  date_start?: string;
  date_end?: string;
}

export interface ObjectFormData {
  name: string;
  address: string;
  is_active: boolean;
  lat?: string; // decimal as string
  lng?: string; // decimal as string
  responsible?: number;
  date_start?: string;
  date_end?: string;
}

// Filter parameters
export interface ObjectFilterParams extends PaginationParams, SearchParams, OrderingParams {
  is_active?: boolean;
  responsible?: number;
  date_start?: string;
  date_end?: string;
  page_size?: number;
}

// Responsible person for objects
export interface ObjectResponsible {
  id: number;
  name: string;
  objects_count: number;
}

// Paginated response
export interface PaginatedObjectList {
  count: number;
  next?: string;
  previous?: string;
  results: Object[];
}

