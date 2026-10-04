import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Enables pull-to-refresh when provided. */
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: ViewStyle;
}

/** Base screen wrapper: themed background + padding + optional scrolling. */
export function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }, contentStyle]}>{children}</View>
    );
  }
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
});
