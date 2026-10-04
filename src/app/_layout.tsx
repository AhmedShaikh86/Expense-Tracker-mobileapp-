import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { ErrorState } from '@/components/StateViews';
import { initDatabase } from '@/db/client';
import { useTheme } from '@/hooks/useTheme';
import { processRecurringExpenses } from '@/services/recurring';
import { applyUpdateIfAvailable } from '@/services/updates';
import { useAuthStore } from '@/store/auth';
import { useCategoriesStore } from '@/store/categories';
import { useDataStore } from '@/store/data';
import { ensureCrossOriginIsolated } from '@/utils/crossOriginIsolation';
import { markStartupSucceeded, reloadIfDatabaseLocked } from '@/utils/webRecovery';

// Keep the splash screen visible until the database is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** App startup: database → recurring entries → categories → login state. */
async function startApp(): Promise<void> {
  await applyUpdateIfAvailable(); // installed APK only: loads newly published code
  await ensureCrossOriginIsolated(); // web only; does nothing on phones
  await initDatabase();
  await processRecurringExpenses();
  await useCategoriesStore.getState().load();
  useAuthStore.getState().init();
}

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  // Increased by the "Try again" button to re-run startup.
  const [attempt, setAttempt] = useState(0);
  const dataVersion = useDataStore((s) => s.version);
  const loadCategories = useCategoriesStore((s) => s.load);

  useEffect(() => {
    startApp()
      .then(() => {
        markStartupSucceeded();
        setStatus('ready');
      })
      .catch((e: unknown) => {
        // Web only: a briefly locked database is fixed by reloading the page.
        if (reloadIfDatabaseLocked(e)) return;
        setError(e instanceof Error ? e.message : 'Could not open the database');
        setStatus('error');
      })
      .finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
  }, [attempt]);

  // Categories may change during a cloud sync, so reload them whenever data changes.
  useEffect(() => {
    if (status === 'ready' && dataVersion > 0) loadCategories();
  }, [dataVersion, status, loadCategories]);

  // Navigation theme built from our own colors (headers, tab bar, backgrounds).
  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  if (status !== 'ready') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {status === 'error' && (
          <ErrorState
            message={error}
            onRetry={() => {
              setStatus('loading');
              setAttempt((n) => n + 1);
            }}
          />
        )}
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expense-form" options={{ title: 'Expense', presentation: 'modal' }} />
        <Stack.Screen name="categories" options={{ title: 'Categories' }} />
        <Stack.Screen name="category-form" options={{ title: 'Category', presentation: 'modal' }} />
        <Stack.Screen name="recurring" options={{ title: 'Recurring expenses' }} />
        <Stack.Screen name="auth" options={{ title: 'Account', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
