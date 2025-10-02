// Notification types

export interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  is_read?: boolean;
  user_id?: number;
  related_type?: 'object' | 'material' | 'purchase' | 'stock';
  related_id?: number;
  action_url?: string;
}

