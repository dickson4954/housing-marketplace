import { API_BASE_URL } from '@/config/api';
import { getMarketplaceSessionToken } from '@/lib/marketplaceSession';

export type EngagementSummary = {
  propertyId: string;
  likeCount: number;
  commentCount: number;
  propertyViewCount: number;
  videoViewCount: number;
  isLiked: boolean;
};

export type PropertyComment = {
  id: string;
  propertyId: string;
  body: string;
  createdAt: string;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export async function getCustomerToken(): Promise<string | null> {
  return getMarketplaceSessionToken();
}

export async function engagementRequest<T>(
  propertyId: string,
  action: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getCustomerToken();

  if (!token) {
    throw new Error('Please log in to use property engagement.');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(
    `${API_BASE_URL}/customer/engagement/${encodeURIComponent(propertyId)}${action}`,
    {
      ...options,
      headers,
    },
  );

  let result: ApiResponse<T> = {};

  try {
    result = await response.json();
  } catch {
    // The response may not contain JSON.
  }

  if (!response.ok) {
    throw new Error(result.message || `Engagement request failed (${response.status}).`);
  }

  return result;
}

export async function getEngagementSummary(
  propertyId: string,
): Promise<EngagementSummary> {
  const result = await engagementRequest<EngagementSummary>(
    propertyId,
    '/summary',
  );

  if (!result.data) {
    throw new Error('The engagement summary was not returned.');
  }

  return result.data;
}

export async function togglePropertyLike(
  propertyId: string,
  currentlyLiked: boolean,
) {
  const result = await engagementRequest<{
    propertyId: string;
    isLiked: boolean;
    likeCount: number;
  }>(
    propertyId,
    '/like',
    { method: currentlyLiked ? 'DELETE' : 'POST' },
  );

  return result.data;
}

export async function getPropertyComments(
  propertyId: string,
): Promise<PropertyComment[]> {
  const result = await engagementRequest<PropertyComment[]>(
    propertyId,
    '/comments',
  );

  return Array.isArray(result.data) ? result.data : [];
}

export async function addPropertyComment(
  propertyId: string,
  body: string,
): Promise<PropertyComment> {
  const result = await engagementRequest<PropertyComment>(
    propertyId,
    '/comments',
    {
      method: 'POST',
      body: JSON.stringify({ body: body.trim() }),
    },
  );

  if (!result.data) {
    throw new Error(result.message || 'The comment was not returned.');
  }

  return result.data;
}

export async function recordPropertyView(propertyId: string) {
  return engagementRequest(propertyId, '/view', { method: 'POST' });
}

export async function recordPropertyVideoView(propertyId: string) {
  return engagementRequest(propertyId, '/video-view', { method: 'POST' });
}
