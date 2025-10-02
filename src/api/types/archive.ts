// Archive types

export interface ArchivePeriod {
  id: number;
  month: string;
  object: number;
  object_name: string;
  closed_at: string;
  closed_by: number;
  closed_by_name: string;
  is_closed: boolean;
}

export interface ClosePeriodRequest {
  object: number;
  month: string; // YYYY-MM
}

export interface ArchiveListQuery {
  object?: number;
  month?: string;
  is_closed?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface ArchivePeriodRequest {
  object: number;
  month: string;
}
