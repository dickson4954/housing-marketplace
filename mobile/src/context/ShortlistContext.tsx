import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

const CUSTOMER_TOKEN_KEY = 'makazii_customer_token';

type ShortlistContextType = {
  shortlistedIds: string[];
  comparisonIds: string[];
  isComparing: (propertyId: string) => boolean;
  toggleCompare: (propertyId: string) => void;
  removeFromComparison: (propertyId: string) => void;
  clearComparison: () => void;
  loading: boolean;
  isShortlisted: (propertyId: string) => boolean;
  toggleShortlist: (propertyId: string) => Promise<void>;
  removeFromShortlist: (propertyId: string) => Promise<void>;
  clearShortlist: () => Promise<void>;
  refreshShortlist: () => Promise<void>;
};

type ShortlistResponse = {
  success?: boolean;
  data?: Array<{
    id: string;
    propertyId: string;
    createdAt?: string;
  }>;
  message?: string;
};

const ShortlistContext = createContext<
  ShortlistContextType | undefined
>(undefined);

async function getCustomerToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (
        typeof window === 'undefined' ||
        !window.localStorage
      ) {
        return null;
      }

      return window.localStorage.getItem(
        CUSTOMER_TOKEN_KEY,
      );
    }

    return await SecureStore.getItemAsync(
      CUSTOMER_TOKEN_KEY,
    );
  } catch (error) {
    console.error(
      'Unable to read customer token:',
      error,
    );

    return null;
  }
}

async function shortlistRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<ShortlistResponse> {
  const token = await getCustomerToken();

  if (!token) {
    throw new Error(
      'Please log in to manage your shortlist.',
    );
  }

  const headers = new Headers(options.headers);

  headers.set(
    'Authorization',
    `Bearer ${token}`,
  );

  headers.set(
    'Accept',
    'application/json',
  );

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  let data: ShortlistResponse = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Unable to update your shortlist.',
    );
  }

  return data;
}

function showShortlistError(error: unknown) {
  console.error(
    'Shortlist error:',
    error,
  );

  const message =
    error instanceof Error
      ? error.message
      : 'Unable to update your shortlist.';

  Alert.alert(
    'Shortlist',
    message,
  );
}

export function ShortlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shortlistedIds, setShortlistedIds] =
    useState<string[]>([]);

  const [comparisonIds, setComparisonIds] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const refreshShortlist = useCallback(
    async () => {
      try {
        setLoading(true);

        const token = await getCustomerToken();

        if (!token) {
          setShortlistedIds([]);
          return;
        }

        const response =
          await shortlistRequest(
            API_ENDPOINTS.customerShortlist,
          );

        const ids =
          response.data?.map(
            (item) => item.propertyId,
          ) ?? [];

        setShortlistedIds(ids);
      } catch (error) {
        console.error(
          'Failed to load customer shortlist:',
          error,
        );

        setShortlistedIds([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refreshShortlist();
  }, [refreshShortlist]);

  const isShortlisted = useCallback(
    (propertyId: string) => {
      return shortlistedIds.includes(propertyId);
    },
    [shortlistedIds],
  );

  const toggleShortlist = useCallback(
    async (propertyId: string) => {
      const currentlyShortlisted =
        shortlistedIds.includes(propertyId);

      try {
        if (currentlyShortlisted) {
          await shortlistRequest(
            API_ENDPOINTS.customerShortlistByProperty(
              propertyId,
            ),
            {
              method: 'DELETE',
            },
          );

          setShortlistedIds((current) =>
            current.filter(
              (id) => id !== propertyId,
            ),
          );

          return;
        }

        await shortlistRequest(
          API_ENDPOINTS.customerShortlistByProperty(
            propertyId,
          ),
          {
            method: 'POST',
          },
        );

        setShortlistedIds((current) => {
          if (current.includes(propertyId)) {
            return current;
          }

          return [
            ...current,
            propertyId,
          ];
        });
      } catch (error) {
        showShortlistError(error);
      }
    },
    [shortlistedIds],
  );

  const removeFromShortlist =
    useCallback(
      async (propertyId: string) => {
        try {
          await shortlistRequest(
            API_ENDPOINTS.customerShortlistByProperty(
              propertyId,
            ),
            {
              method: 'DELETE',
            },
          );

          setShortlistedIds((current) =>
            current.filter(
              (id) => id !== propertyId,
            ),
          );
        } catch (error) {
          showShortlistError(error);
        }
      },
      [],
    );

  const clearShortlist = useCallback(
    async () => {
      try {
        await shortlistRequest(
          API_ENDPOINTS.customerShortlist,
          {
            method: 'DELETE',
          },
        );

        setShortlistedIds([]);
      } catch (error) {
        showShortlistError(error);
      }
    },
    [],
  );

  const isComparing = useCallback(
    (propertyId: string) => comparisonIds.includes(propertyId),
    [comparisonIds],
  );

  const toggleCompare = useCallback((propertyId: string) => {
    setComparisonIds((current) => {
      if (current.includes(propertyId)) {
        return current.filter((id) => id !== propertyId);
      }

      if (current.length >= 3) {
        Alert.alert(
          'Compare up to 3 homes',
          'Remove a selected home before adding another.',
        );
        return current;
      }

      return [...current, propertyId];
    });
  }, []);

  const removeFromComparison = useCallback((propertyId: string) => {
    setComparisonIds((current) => current.filter((id) => id !== propertyId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonIds([]);
  }, []);

  const value =
    useMemo<ShortlistContextType>(
      () => ({
        shortlistedIds,
        comparisonIds,
        isComparing,
        toggleCompare,
        removeFromComparison,
        clearComparison,
        loading,
        isShortlisted,
        toggleShortlist,
        removeFromShortlist,
        clearShortlist,
        refreshShortlist,
      }),
      [
        shortlistedIds,
        comparisonIds,
        isComparing,
        toggleCompare,
        removeFromComparison,
        clearComparison,
        loading,
        isShortlisted,
        toggleShortlist,
        removeFromShortlist,
        clearShortlist,
        refreshShortlist,
      ],
    );

  return (
    <ShortlistContext.Provider
      value={value}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist(): ShortlistContextType {
  const context =
    useContext(ShortlistContext);

  if (!context) {
    throw new Error(
      'useShortlist must be used inside ShortlistProvider',
    );
  }

  return context;
}
