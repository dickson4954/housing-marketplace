import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { getCustomerToken } from '@/lib/customerEngagement';

export type CustomerNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};

export type NotificationPage = {
  notifications: CustomerNotification[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  unreadCount: number;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

async function notificationRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getCustomerToken();

  if (!token) {
    throw new Error('Please log in to view your notifications.');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let result: ApiResponse<T> = {};

  try {
    result = await response.json();
  } catch {
    // Handle an empty or non-JSON server response below.
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Notification request failed (${response.status}).`,
    );
  }

  return result;
}

export async function getCustomerNotifications(
  options: {
    page?: number;
    limit?: number;
    unread?: boolean;
  } = {},
): Promise<NotificationPage> {
  const params = new URLSearchParams();

  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? 20));

  if (options.unread !== undefined) {
    params.set('unread', String(options.unread));
  }

  const result = await notificationRequest<NotificationPage>(
    `${API_ENDPOINTS.customerNotifications}?${params.toString()}`,
  );

  if (!result.data) {
    throw new Error('Notifications were not returned by the server.');
  }

  return result.data;
}

export async function getCustomerUnreadNotificationCount(): Promise<number> {
  const result = await notificationRequest<{ unreadCount: number }>(
    API_ENDPOINTS.customerNotificationUnreadCount,
  );

  return result.data?.unreadCount ?? 0;
}

export async function markCustomerNotificationRead(
  notificationId: string,
): Promise<CustomerNotification | null> {
  const result = await notificationRequest<{
    notification: CustomerNotification;
  }>(
    API_ENDPOINTS.customerNotificationRead(notificationId),
    { method: 'PATCH' },
  );

  return result.data?.notification ?? null;
}

export async function markAllCustomerNotificationsRead(): Promise<number> {
  const result = await notificationRequest<{ updatedCount: number }>(
    API_ENDPOINTS.customerNotificationReadAll,
    { method: 'PATCH' },
  );

  return result.data?.updatedCount ?? 0;
}
