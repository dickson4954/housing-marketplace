import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

const ADMIN_TOKEN_KEY = 'makazii_admin_token';

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  accountStatus?: string;
  statusReason?: string | null;
  statusChangedAt?: string | null;
  statusChangedById?: string | null;
  isActive: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAdminProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
};

type AdminContextValue = {
  currentAdmin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  resetLogoutState: () => void;
  refreshCurrentAdmin: () => Promise<AdminUser | null>;
  updateAdminProfile: (
    changes: UpdateAdminProfileInput
  ) => Promise<AdminUser | null>;
  changeAdminPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

type ApiResponse = {
  response: Response;
  body: any;
};

const AdminContext =
  createContext<AdminContextValue | undefined>(
    undefined
  );

async function getAdminToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      return window.localStorage.getItem(
        ADMIN_TOKEN_KEY
      );
    }

    return null;
  }

  return SecureStore.getItemAsync(
    ADMIN_TOKEN_KEY
  );
}

async function removeAdminToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.removeItem(
        ADMIN_TOKEN_KEY
      );
    }

    return;
  }

  await SecureStore.deleteItemAsync(
    ADMIN_TOKEN_KEY
  );
}

function getApiErrorMessage(
  response: Response,
  body: any
): string {
  if (
    body &&
    typeof body.message === 'string' &&
    body.message.trim()
  ) {
    return body.message;
  }

  if (
    body &&
    typeof body.error === 'string' &&
    body.error.trim()
  ) {
    return body.error;
  }

  if (
    body &&
    Array.isArray(body.errors) &&
    body.errors.length > 0
  ) {
    return body.errors
      .map((error: any) => {
        if (typeof error === 'string') {
          return error;
        }

        return (
          error?.message ||
          error?.msg ||
          'Validation error'
        );
      })
      .join(', ');
  }

  return `Request failed with status ${response.status}.`;
}

function normalizeAdmin(
  raw: any
): AdminUser | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const user =
    raw.user &&
    typeof raw.user === 'object'
      ? raw.user
      : raw;

  if (!user.id) {
    return null;
  }

  return {
    id: String(user.id),
    firstName: String(user.firstName ?? ''),
    lastName: String(user.lastName ?? ''),
    email: String(user.email ?? ''),
    phone:
      user.phone === null ||
      user.phone === undefined
        ? null
        : String(user.phone),
    role: String(user.role ?? 'ADMIN'),
    accountStatus:
      user.accountStatus === undefined
        ? undefined
        : String(user.accountStatus),
    statusReason:
      user.statusReason === undefined
        ? null
        : user.statusReason,
    statusChangedAt:
      user.statusChangedAt ?? null,
    statusChangedById:
      user.statusChangedById ?? null,
    isActive: Boolean(user.isActive),
    emailVerifiedAt:
      user.emailVerifiedAt ?? null,
    createdAt: String(
      user.createdAt ?? ''
    ),
    updatedAt: String(
      user.updatedAt ?? ''
    ),
  };
}

function extractUser(body: any): any {
  if (
    body?.data?.user &&
    typeof body.data.user === 'object'
  ) {
    return body.data.user;
  }

  if (
    body?.user &&
    typeof body.user === 'object'
  ) {
    return body.user;
  }

  if (
    body?.data &&
    typeof body.data === 'object' &&
    body.data.id
  ) {
    return body.data;
  }

  return body;
}

async function adminApiRequest(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse> {
  const token = await getAdminToken();

  if (!token) {
    throw new Error(
      'Your administrator session has expired. Please sign in again.'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (
    response.status === 401
  ) {
    await removeAdminToken();
  }

  return {
    response,
    body,
  };
}

export function AdminProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentAdmin, setCurrentAdmin] =
    useState<AdminUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const resetLogoutState = useCallback((): void => {
    setIsLoggingOut(false);
  }, []);

  const refreshCurrentAdmin =
    useCallback(
      async (): Promise<AdminUser | null> => {
        setIsLoggingOut(false);
        try {
          const token =
            await getAdminToken();

          if (!token) {
            setCurrentAdmin(null);
            return null;
          }

          const { response, body } =
            await adminApiRequest(
              API_ENDPOINTS.me,
              {
                method: 'GET',
              }
            );

          if (
            response.status === 401
          ) {
            await removeAdminToken();
            setCurrentAdmin(null);
            return null;
          }

          if (!response.ok) {
            throw new Error(
              getApiErrorMessage(
                response,
                body
              )
            );
          }

          const admin =
            normalizeAdmin(
              extractUser(body)
            );

          if (!admin) {
            throw new Error(
              'The server returned an invalid admin profile.'
            );
          }

          if (admin.role !== 'ADMIN') {
            await removeAdminToken();
            setCurrentAdmin(null);

            throw new Error(
              'This account does not have administrator access.'
            );
          }

          if (!admin.isActive) {
            await removeAdminToken();
            setCurrentAdmin(null);

            throw new Error(
              'This administrator account is inactive.'
            );
          }

          setCurrentAdmin(admin);

          return admin;
        } catch (error) {
          console.error(
            'Refresh admin profile error:',
            error
          );

          setCurrentAdmin(null);

          return null;
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

  const updateAdminProfile =
    useCallback(
      async (
        changes: UpdateAdminProfileInput
      ): Promise<AdminUser | null> => {
        const payload = {
          ...(changes.firstName !== undefined
            ? {
                firstName:
                  changes.firstName.trim(),
              }
            : {}),
          ...(changes.lastName !== undefined
            ? {
                lastName:
                  changes.lastName.trim(),
              }
            : {}),
          ...(changes.email !== undefined
            ? {
                email:
                  changes.email.trim(),
              }
            : {}),
          ...(changes.phone !== undefined
            ? {
                phone:
                  changes.phone?.trim() || null,
              }
            : {}),
        };

        const { response, body } =
          await adminApiRequest(
            API_ENDPOINTS.profile,
            {
              method: 'PATCH',
              body: JSON.stringify(
                payload
              ),
            }
          );

        if (
          response.status === 401
        ) {
          setCurrentAdmin(null);

          throw new Error(
            'Your administrator session has expired. Please sign in again.'
          );
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              response,
              body
            )
          );
        }

        const updatedAdmin =
          normalizeAdmin(
            extractUser(body)
          );

        if (!updatedAdmin) {
          throw new Error(
            'Profile was updated, but the server returned an invalid admin profile.'
          );
        }

        if (
          updatedAdmin.role !== 'ADMIN'
        ) {
          await removeAdminToken();
          setCurrentAdmin(null);

          throw new Error(
            'The updated account does not have administrator access.'
          );
        }

        setCurrentAdmin(
          updatedAdmin
        );

        return updatedAdmin;
      },
      []
    );

  const changeAdminPassword =
    useCallback(
      async (
        currentPassword: string,
        newPassword: string
      ): Promise<void> => {
        if (!currentPassword.trim()) {
          throw new Error(
            'Please enter your current password.'
          );
        }

        if (!newPassword.trim()) {
          throw new Error(
            'Please enter your new password.'
          );
        }

        const { response, body } =
          await adminApiRequest(
            API_ENDPOINTS.changePassword,
            {
              method: 'PATCH',
              body: JSON.stringify({
                currentPassword,
                newPassword,
              }),
            }
          );

        if (
          response.status === 401
        ) {
          setCurrentAdmin(null);

          throw new Error(
            'Your administrator session has expired. Please sign in again.'
          );
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              response,
              body
            )
          );
        }

        if (
          body &&
          body.success === false
        ) {
          throw new Error(
            getApiErrorMessage(
              response,
              body
            )
          );
        }
      },
      []
    );

  const logout =
    useCallback(async (): Promise<void> => {
      setIsLoggingOut(true);
      try {
        await removeAdminToken();
      } finally {
        setCurrentAdmin(null);
      }
    }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshCurrentAdmin();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshCurrentAdmin]);

  const value = useMemo(
    () => ({
      currentAdmin,
      isAuthenticated:
        currentAdmin !== null,
      isLoading,
      isLoggingOut,
      resetLogoutState,
      refreshCurrentAdmin,
      updateAdminProfile,
      changeAdminPassword,
      logout,
    }),
    [
      currentAdmin,
      isLoading,
      isLoggingOut,
      resetLogoutState,
      refreshCurrentAdmin,
      updateAdminProfile,
      changeAdminPassword,
      logout,
    ]
  );

  return (
    <AdminContext.Provider
      value={value}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context =
    useContext(AdminContext);

  if (!context) {
    throw new Error(
      'useAdmin must be used inside an AdminProvider.'
    );
  }

  return context;
}
