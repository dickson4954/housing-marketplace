import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribeToColorScheme(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', callback);

  return () => {
    mediaQuery.removeEventListener('change', callback);
  };
}

function getColorSchemeSnapshot(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getServerColorSchemeSnapshot(): 'light' {
  return 'light';
}

/**
 * Use a stable light snapshot during server rendering and hydration,
 * then subscribe to the browser's preferred color scheme.
 */
export function useColorScheme() {
  const browserScheme = useSyncExternalStore(
    subscribeToColorScheme,
    getColorSchemeSnapshot,
    getServerColorSchemeSnapshot,
  );

  const nativeScheme = useRNColorScheme();

  return browserScheme ?? nativeScheme ?? 'light';
}
