// Main types index - re-exports all types for backward compatibility

// Common types
export * from './common';

// Authentication
export * from './auth';

// Employee types
export * from './employees';

// Material types
export * from './materials';

// Object types
export * from './objects';

// Unit types
export * from './units';

// Purchase types
export * from './purchases';

// Stock types
export * from './stocks';

// Supplier types
export * from './suppliers';

// Report types
export * from './reports';

// Import types
export * from './import';

// Tools types
export * from './tools';

// Notification types
export * from './notifications';

// Audit types
export * from './audit';

// Error types
export * from './errors';

// Legacy compatibility - keep old imports working
export type { Unit } from './common';
export type { MaterialCategory, MaterialCategoryLite } from './common';
export type { PaginatedResponse, ApiError, PaginationState } from './common';
export type { SmartQuantity } from './common';

// Legacy pagination types
export interface PageResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}