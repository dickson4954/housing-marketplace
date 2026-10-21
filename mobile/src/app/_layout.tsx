import React from 'react';
import {
  Stack,
  DarkTheme,
  ThemeProvider,
  usePathname,
} from 'expo-router';

import { PropertyProvider } from '@/context/PropertyContext';
import { ShortlistProvider } from '@/context/ShortlistContext';
import { ViewingProvider } from '@/context/ViewingContext';
import { MarketerProvider } from '@/context/MarketerContext';
import { FeedbackProvider } from '@/context/FeedbackContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { AdminProvider } from '@/context/AdminContext';

import AppTabs from '@/components/app-tabs';

function AppContent() {
  const pathname = usePathname();

  // Admin pages should have their own dashboard navigation.
  const isAdminPage = pathname.startsWith('/admin');

  // Marketer pages should have their own portal navigation.
  const isMarketerPage =
    pathname.startsWith('/marketer');

  // Onboarding pages should not have customer bottom navigation.
  const isOnboardingPage =
    pathname.startsWith('/onboarding');

  // The initial "/" screen should not have bottom navigation.
  const isInitialPage = pathname === '/';

  const showBottomTabs =
    !isAdminPage &&
    !isMarketerPage &&
    !isOnboardingPage &&
    !isInitialPage;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: '#0B0F10',
          },
        }}
      />

      {showBottomTabs && <AppTabs />}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <CustomerProvider>
        <PropertyProvider>
          <ShortlistProvider>
            <ViewingProvider>
              <MarketerProvider>
                <AdminProvider>
                  <FeedbackProvider>
                    <AppContent />
                  </FeedbackProvider>
                </AdminProvider>
              </MarketerProvider>
            </ViewingProvider>
          </ShortlistProvider>
        </PropertyProvider>
      </CustomerProvider>
    </ThemeProvider>
  );
}