// Audit types

export interface AuditLog {
  id: number;
  ts: string;
  user?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  action_display: string;
  model: string;
  model_display: string;
  object_id: string;
  detail: string;
  ip?: string;
}

