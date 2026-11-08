import React, {
  createContext,
  ReactNode,
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

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  hasLoggedInBefore: boolean;
};

export type SignUpInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

export type LoginInput = {
  emailOrPhone: string;
  password: string;
};

export type VerifyEmailInput = {
  email: string;
  code: string;
};

type AuthResponse = {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: BackendUser;
    verificationRequired?: boolean;
    verificationExpiresAt?: string;
    message?: string;
  };
};

type BackendUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CustomerContextValue = {
  customers: Customer[];

  currentCustomer: Customer | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  signUp: (
    input: SignUpInput
  ) => Promise<{
    success: boolean;
    customer?: Customer;
    message: string;
    verificationRequired?: boolean;
    verificationExpiresAt?: string;
  }>;

  verifyEmail: (
    input: VerifyEmailInput
  ) => Promise<{
    success: boolean;
    customer?: Customer;
    message: string;
  }>;

  resendVerification: (
    email: string
  ) => Promise<{
    success: boolean;
    message: string;
    verificationExpiresAt?: string;
  }>;

  login: (
    input: LoginInput
  ) => Promise<{
    success: boolean;
    customer?: Customer;
    message: string;
  }>;

  logout: () => Promise<void>;

  updateProfile: (
    changes: Partial<
      Pick<Customer, 'name' | 'phone' | 'email'>
    >
  ) => Promise<{
    success: boolean;
    customer?: Customer;
    message: string;
  }>;

  getCustomerById: (
    id: string
  ) => Customer | undefined;

  getCurrentGreeting: () => string;

  isReturningCustomer: boolean;
};

const TOKEN_KEY = 'makazii_customer_token';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').trim();
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function splitFullName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: '',
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function mapBackendUser(
  user: BackendUser,
  previousCustomer?: Customer | null
): Customer {
  const name = `${user.firstName} ${user.lastName}`
    .trim();

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name,
    phone: user.phone ?? '',
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin:
      previousCustomer?.lastLogin ?? '',
    hasLoggedInBefore:
      previousCustomer?.hasLoggedInBefore ?? false,
  };
}

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (
        typeof window === 'undefined' ||
        !window.localStorage
      ) {
        return null;
      }

      return window.localStorage.getItem(TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error(
      'Unable to read customer token:',
      error
    );

    return null;
  }
}

async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.setItem(
        TOKEN_KEY,
        token
      );
    }

    return;
  }

  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token
  );
}

async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.removeItem(
        TOKEN_KEY
      );
    }

    return;
  }

  await SecureStore.deleteItemAsync(
    TOKEN_KEY
  );
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(
    options.headers
  );

  headers.set(
    'Content-Type',
    'application/json'
  );

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data: T;

  try {
    data = (await response.json()) as T;
  } catch {
    throw new Error(
      'The server returned an invalid response.'
    );
  }

  return data;
}

const CustomerContext =
  createContext<CustomerContextValue | undefined>(
    undefined
  );

export function CustomerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [currentCustomer, setCurrentCustomer] =
    useState<Customer | null>(null);

  const [isReturningCustomer, setIsReturningCustomer] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const restoreSession = useCallback(
    async () => {
      try {
        const token =
          await getStoredToken();

        if (!token) {
          return;
        }

        const response =
          await apiRequest<AuthResponse>(
            API_ENDPOINTS.me,
            {
              method: 'GET',
            },
            token
          );

        if (
          !response.success ||
          !response.data?.user
        ) {
          await removeToken();
          return;
        }

        const customer =
          mapBackendUser(
            response.data.user,
            currentCustomer
          );

        setCurrentCustomer(customer);
        setCustomers([customer]);
        setIsReturningCustomer(true);
      } catch (error) {
        console.error(
          'Customer session restore error:',
          error
        );

        await removeToken();
        setCurrentCustomer(null);
      } finally {
        setIsLoading(false);
      }
    },
    [currentCustomer]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void restoreSession();
    }, 0);

    return () => clearTimeout(timer);
  }, [restoreSession]);

  const signUp = useCallback(
    async (
      input: SignUpInput
    ): Promise<{
      success: boolean;
      customer?: Customer;
      message: string;
      verificationRequired?: boolean;
      verificationExpiresAt?: string;
    }> => {
      const name = input.name.trim();
      const phone = normalizePhone(
        input.phone
      );
      const email = normalizeEmail(
        input.email
      );
      const password =
        input.password;

      if (name.length < 2) {
        return {
          success: false,
          message:
            'Please enter your full name.',
        };
      }

      if (phone.replace(/\D/g, '').length < 9) {
        return {
          success: false,
          message:
            'Please enter a valid phone number.',
        };
      }

      if (!email.includes('@')) {
        return {
          success: false,
          message:
            'Please enter a valid email address.',
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          message:
            'Password must be at least 6 characters.',
        };
      }

      const {
        firstName,
        lastName,
      } = splitFullName(name);

      try {
        const response =
          await apiRequest<AuthResponse>(
            API_ENDPOINTS.customerSignup,
            {
              method: 'POST',
              body: JSON.stringify({
                firstName,
                lastName,
                email,
                phone,
                password,
              }),
            }
          );

        if (
          !response.success ||
          !response.data?.user
        ) {
          return {
            success: false,
            message:
              response.message ||
              'Unable to create your account.',
          };
        }

        const customer =
          mapBackendUser(
            response.data.user
          );

        return {
          success: true,
          customer,
          message:
            response.message ||
            'Your MAKAZII account has been created successfully.',
          verificationRequired:
            response.data
              .verificationRequired,
          verificationExpiresAt:
            response.data
              .verificationExpiresAt,
        };
      } catch (error) {
        console.error(
          'Customer signup error:',
          error
        );

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to connect to MAKAZII.',
        };
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (
      input: VerifyEmailInput
    ): Promise<{
      success: boolean;
      customer?: Customer;
      message: string;
    }> => {
      const email = normalizeEmail(
        input.email
      );

      const code =
        input.code.trim();

      if (!email) {
        return {
          success: false,
          message:
            'Please enter your email address.',
        };
      }

      if (!/^\d{6}$/.test(code)) {
        return {
          success: false,
          message:
            'Please enter the 6-digit verification code.',
        };
      }

      try {
        const response =
          await apiRequest<AuthResponse>(
            API_ENDPOINTS.customerVerifyEmail,
            {
              method: 'POST',
              body: JSON.stringify({
                email,
                code,
              }),
            }
          );

        if (
          !response.success ||
          !response.data?.user
        ) {
          return {
            success: false,
            message:
              response.message ||
              'Unable to verify your email.',
          };
        }

        const customer =
          mapBackendUser(
            response.data.user
          );

        return {
          success: true,
          customer,
          message:
            response.message ||
            'Email verified successfully.',
        };
      } catch (error) {
        console.error(
          'Customer email verification error:',
          error
        );

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to connect to MAKAZII.',
        };
      }
    },
    []
  );

  const resendVerification =
    useCallback(
      async (
        emailInput: string
      ): Promise<{
        success: boolean;
        message: string;
        verificationExpiresAt?: string;
      }> => {
        const email =
          normalizeEmail(emailInput);

        if (!email) {
          return {
            success: false,
            message:
              'Please enter your email address.',
          };
        }

        try {
          const response =
            await apiRequest<AuthResponse>(
              API_ENDPOINTS.customerResendVerification,
              {
                method: 'POST',
                body: JSON.stringify({
                  email,
                }),
              }
            );

          if (!response.success) {
            return {
              success: false,
              message:
                response.message ||
                'Unable to resend verification code.',
            };
          }

          return {
            success: true,
            message:
              response.message ||
              'A new verification code has been generated.',
            verificationExpiresAt:
              response.data
                ?.verificationExpiresAt,
          };
        } catch (error) {
          console.error(
            'Customer verification resend error:',
            error
          );

          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Unable to connect to MAKAZII.',
          };
        }
      },
      []
    );

  const login = useCallback(
    async (
      input: LoginInput
    ): Promise<{
      success: boolean;
      customer?: Customer;
      message: string;
    }> => {
      const identifier =
        input.emailOrPhone.trim();

      const password =
        input.password;

      if (!identifier) {
        return {
          success: false,
          message:
            'Please enter your email or phone number.',
        };
      }

      if (!password) {
        return {
          success: false,
          message:
            'Please enter your password.',
        };
      }

      try {
        const response =
          await apiRequest<AuthResponse>(
            API_ENDPOINTS.customerLogin,
            {
              method: 'POST',
              body: JSON.stringify({
                emailOrPhone:
                  identifier,
                password,
              }),
            }
          );

        if (
          !response.success ||
          !response.data?.token ||
          !response.data?.user
        ) {
          return {
            success: false,
            message:
              response.message ||
              'Unable to log in.',
          };
        }

        await saveToken(
          response.data.token
        );

        const previousCustomer =
          currentCustomer;

        const customer =
          mapBackendUser(
            response.data.user,
            previousCustomer
          );

        const wasReturningCustomer =
          Boolean(
            previousCustomer?.hasLoggedInBefore
          );

        const updatedCustomer: Customer = {
          ...customer,
          lastLogin:
            new Date().toISOString(),
          hasLoggedInBefore: true,
        };

        setCustomers([
          updatedCustomer,
        ]);

        setCurrentCustomer(
          updatedCustomer
        );

        setIsReturningCustomer(
          wasReturningCustomer
        );

        return {
          success: true,
          customer: updatedCustomer,
          message:
            response.message ||
            'Login successful.',
        };
      } catch (error) {
        console.error(
          'Customer login error:',
          error
        );

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to connect to MAKAZII.',
        };
      }
    },
    [currentCustomer]
  );

  const logout = useCallback(
    async () => {
      await removeToken();

      setCurrentCustomer(null);
      setCustomers([]);
      setIsReturningCustomer(false);
    },
    []
  );

  const updateProfile = useCallback(
    async (
      changes: Partial<
        Pick<
          Customer,
          'name' | 'phone' | 'email'
        >
      >
    ): Promise<{
      success: boolean;
      customer?: Customer;
      message: string;
    }> => {
      if (!currentCustomer) {
        return {
          success: false,
          message:
            'You are not logged in.',
        };
      }

      const token =
        await getStoredToken();

      if (!token) {
        return {
          success: false,
          message:
            'Your session has expired. Please log in again.',
        };
      }

      const name =
        changes.name !== undefined
          ? changes.name.trim()
          : currentCustomer.name;

      const {
        firstName,
        lastName,
      } = splitFullName(name);

      try {
        const response =
          await apiRequest<AuthResponse>(
            API_ENDPOINTS.profile,
            {
              method: 'PATCH',
              body: JSON.stringify({
                firstName,
                lastName,
                phone:
                  changes.phone !== undefined
                    ? normalizePhone(
                        changes.phone
                      )
                    : currentCustomer.phone,
                email:
                  changes.email !== undefined
                    ? normalizeEmail(
                        changes.email
                      )
                    : currentCustomer.email,
              }),
            },
            token
          );

        if (
          !response.success ||
          !response.data?.user
        ) {
          return {
            success: false,
            message:
              response.message ||
              'Unable to update your profile.',
          };
        }

        const updatedCustomer =
          mapBackendUser(
            response.data.user,
            currentCustomer
          );

        setCurrentCustomer(
          updatedCustomer
        );

        setCustomers([
          updatedCustomer,
        ]);

        return {
          success: true,
          customer:
            updatedCustomer,
          message:
            response.message ||
            'Profile updated successfully.',
        };
      } catch (error) {
        console.error(
          'Customer profile update error:',
          error
        );

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to connect to MAKAZII.',
        };
      }
    },
    [currentCustomer]
  );

  const getCustomerById =
    useCallback(
      (
        id: string
      ): Customer | undefined => {
        return customers.find(
          (customer) =>
            customer.id === id
        );
      },
      [customers]
    );

  const getCurrentGreeting =
    useCallback(() => {
      return getGreeting();
    }, []);

  const value =
    useMemo<CustomerContextValue>(
      () => ({
        customers,
        currentCustomer,
        isAuthenticated:
          currentCustomer !== null,
        isLoading,
        signUp,
        verifyEmail,
        resendVerification,
        login,
        logout,
        updateProfile,
        getCustomerById,
        getCurrentGreeting,
        isReturningCustomer,
      }),
      [
        customers,
        currentCustomer,
        isLoading,
        signUp,
        verifyEmail,
        resendVerification,
        login,
        logout,
        updateProfile,
        getCustomerById,
        getCurrentGreeting,
        isReturningCustomer,
      ]
    );

  return (
    <CustomerContext.Provider
      value={value}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerContextValue {
  const context =
    useContext(CustomerContext);

  if (!context) {
    throw new Error(
      'useCustomer must be used inside a CustomerProvider'
    );
  }

  return context;
}
