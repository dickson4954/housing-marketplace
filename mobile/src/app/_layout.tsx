import React from 'react';
import {
  Stack,
  DarkTheme,
  ThemeProvider,
  usePathname,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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

  const isAdminPage = pathname.startsWith('/admin');
  const isMarketerPage = pathname.startsWith('/marketer');
  const isLandlordPage = pathname.startsWith('/landlord');
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isBusinessPage = pathname.startsWith('/business');
  const isInitialPage = pathname === '/';
  const isStayBookingPage = pathname.startsWith('/stay-booking');
  const isInspectionPage = pathname.startsWith('/inspection');

  // Keep the floating navigation away from payment and booking actions.
  const isTransactionPage = isStayBookingPage || isInspectionPage;

  const showBottomTabs =
    !isAdminPage &&
    !isMarketerPage &&
    !isLandlordPage &&
    !isOnboardingPage &&
    !isBusinessPage &&
    !isInitialPage &&
    !isTransactionPage;

  return (
    <>
      <StatusBar style="light" hidden={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0B0F10' },
        }}
      />
      {showBottomTabs && <AppTabs />}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
