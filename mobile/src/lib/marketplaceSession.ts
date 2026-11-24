import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type MarketplaceSessionSource = 'customer' | 'business';

const CUSTOMER_TOKEN_KEY = 'makazii_customer_token';
const BUSINESS_TOKEN_KEY = 'makazii_business_owner_token';
const SESSION_SOURCE_KEY = 'makazii_marketplace_session_source';

async function readValue(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      return window.localStorage.getItem(key);
    }

    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return null;
  }
}

async function writeValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('Marketplace session storage is unavailable.');
    }

    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getTokenForMarketplaceSource(
  source: MarketplaceSessionSource,
): Promise<string | null> {
  return readValue(
    source === 'business' ? BUSINESS_TOKEN_KEY : CUSTOMER_TOKEN_KEY,
  );
}

/**
 * Selects which existing authenticated identity is active in Marketplace.
 * This marker is not an authentication token and never grants permissions.
 */
export async function setMarketplaceSessionSource(
  source: MarketplaceSessionSource,
): Promise<void> {
  const token = await getTokenForMarketplaceSource(source);

  if (!token) {
    throw new Error(
      source === 'business'
        ? 'Your business session is unavailable. Please sign in to your business account.'
        : 'Your customer session is unavailable. Please sign in to your customer account.',
    );
  }

  await writeValue(SESSION_SOURCE_KEY, source);
}

export async function getMarketplaceSessionSource():
Promise<MarketplaceSessionSource | null> {
  const storedSource = await readValue(SESSION_SOURCE_KEY);

  if (storedSource === 'business' || storedSource === 'customer') {
    const token = await getTokenForMarketplaceSource(storedSource);
    return token ? storedSource : null;
  }

  // Backward compatibility: existing customer sessions remain customer sessions.
  // A stored business token alone must never silently activate Marketplace.
  const customerToken = await getTokenForMarketplaceSource('customer');

  return customerToken ? 'customer' : null;
}

export async function getMarketplaceSessionToken(): Promise<string | null> {
  const source = await getMarketplaceSessionSource();

  if (!source) {
    return null;
  }

  return getTokenForMarketplaceSource(source);
}

export async function clearMarketplaceSessionSource(
  expectedSource?: MarketplaceSessionSource,
): Promise<void> {
  if (expectedSource) {
    const currentSource = await readValue(SESSION_SOURCE_KEY);

    if (currentSource !== expectedSource) {
      return;
    }
  }

  await deleteValue(SESSION_SOURCE_KEY);
}
