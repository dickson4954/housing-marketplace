import { API_BASE_URL } from '@/config/api';

export type PublicStorefrontCategory = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  displayOrder?: number;
  imageUrl?: string | null;
};

export type PublicStorefrontVariant = {
  id: string;
  name: string;
  options?: unknown;
  priceAmount?: number | string | null;
  displayOrder?: number;
};

export type PublicStorefrontImage = {
  id: string;
  altText?: string | null;
  displayOrder?: number;
  imageUrl?: string | null;
};

export type PublicStorefrontItem = {
  id: string;
  categoryId?: string | null;
  type?: string;
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  currency?: string | null;
  priceAmount?: number | string | null;
  compareAtPriceAmount?: number | string | null;
  specifications?: unknown;
  attributes?: unknown;
  durationMinutes?: number | null;
  preparationMinutes?: number | null;
  isBookable?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  category?: { id?: string; name?: string } | null;
  variants?: PublicStorefrontVariant[];
  images?: PublicStorefrontImage[];
};

export type StorefrontCatalogueSnapshot = {
  categories: PublicStorefrontCategory[];
  items: PublicStorefrontItem[];
};

export type PublicStorefrontSnapshot = {
  business: {
    id: string;
    name: string;
    category: string;
    categoryLabel?: string | null;
    description?: string | null;
  };
  profile?: {
    publicDisplayName?: string | null;
    tagline?: string | null;
    publicDescription?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    websiteUrl?: string | null;
    addressLine?: string | null;
    county?: string | null;
    constituency?: string | null;
    ward?: string | null;
  } | null;
  storefront: {
    themeKey?: string;
    layoutKey?: string;
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    customSettings?: Record<string, unknown> | null;
  };
  catalogue: StorefrontCatalogueSnapshot;
};

export type PublicBusinessBranch = {
  id: string;
  name: string;
  publicLocationLabel?: string | null;
  locationType: string;
  county?: string | null;
  constituency?: string | null;
  ward?: string | null;
  place?: string | null;
};

export type PublicBusinessStorefront = {
  businessId: string;
  publishedAt: string;
  storefront: PublicStorefrontSnapshot;
  branches?: PublicBusinessBranch[];
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

function apiUrl(endpoint: string) {
  return `${API_BASE_URL.replace(/\/+$/, '')}${endpoint}`;
}

/**
 * Resolves backend asset paths without duplicating the /api prefix.
 * Absolute URLs are returned unchanged.
 */
export function resolveStorefrontAssetUrl(
  value?: string | null,
): string | null {
  if (!value?.trim()) return null;

  const url = value.trim();

  if (/^https?:\/\//i.test(url)) return url;

  const origin = API_BASE_URL.replace(/\/api\/?$/i, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

async function publicRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let payload: ApiEnvelope<T>;

  try {
    payload = await response.json();
  } catch {
    throw new Error('The storefront service returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ||
      payload?.error ||
      `Storefront request failed (${response.status}).`,
    );
  }

  if (payload?.data === undefined || payload?.data === null) {
    throw new Error('The storefront service returned no data.');
  }

  return payload.data;
}

export async function getPublicBusinessStorefronts(): Promise<
  PublicBusinessStorefront[]
> {
  const data = await publicRequest<
    PublicBusinessStorefront[] | { items?: PublicBusinessStorefront[] }
  >('/public/business-storefronts');

  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

export async function getPublicBusinessStorefront(
  businessId: string,
): Promise<PublicBusinessStorefront> {
  return publicRequest<PublicBusinessStorefront>(
    `/public/business-storefronts/${encodeURIComponent(businessId)}`,
  );
}
