export interface NotificationItem {
  id: number;
  event_type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationList {
  count: number;
  totalPages: number;
  page: number;
  pageSize: number;
  results: NotificationItem[];
}

export interface NotificationSummary {
  unread: number;
  read: number;
}

export interface NotificationQuery {
  page: number;
  pageSize: number;
  eventType?: string;
  isRead?: boolean;
}
