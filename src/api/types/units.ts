// Unit types

import type { Unit, PaginationParams, SearchParams, OrderingParams } from './common';

export interface UnitRequest {
  code: string;
  name: string;
}

export interface PatchedUnitRequest {
  code?: string;
  name?: string;
}

// Filter parameters
export interface UnitFilterParams extends PaginationParams, SearchParams, OrderingParams {
  code?: string;
  name?: string;
  page_size?: number;
}

// Paginated response
export interface PaginatedUnitList {
  count: number;
  next?: string;
  previous?: string;
  results: Unit[];
}
