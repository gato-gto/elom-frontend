// Import types

export interface ImportPrepareResponse {
  file_hash: string;
  headers: string[];
  preview: any[][];
  suggested_mapping: Record<string, string>;
}

export interface ImportDryRunRequest {
  file_hash: string;
  mapping: Record<string, string>;
}

export interface ImportDryRunResponse {
  valid_rows: number;
  invalid_rows: number;
  errors: string[];
  preview: any[][];
}

export interface ImportCommitRequest {
  file_hash: string;
  mapping: Record<string, string>;
  object_id: number;
  responsible_id: number;
}

export interface ImportCommitResponse {
  created_purchases: number;
  created_items: number;
  errors: string[];
}