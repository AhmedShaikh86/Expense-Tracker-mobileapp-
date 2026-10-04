import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';

/**
 * Standard loading / empty / error views, so every screen handles these
 * states the same way.
 */

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText muted style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={56} color={colors.textSecondary} />
      <AppText variant="heading" style={styles.text}>
        {title}
      </AppText>
      {message && (
        <AppText muted style={styles.message}>
          {message}
        </AppText>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} icon="add" style={styles.button} />
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
      <AppText variant="heading" style={styles.text}>
        Something went wrong
      </AppText>
      <AppText muted style={styles.message}>
        {message}
      </AppText>
      {onRetry && <Button title="Try again" onPress={onRetry} variant="secondary" style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, minHeight: 240 },
  text: { marginTop: Spacing.md, textAlign: 'center' },
  message: { marginTop: Spacing.xs, textAlign: 'center' },
  button: { marginTop: Spacing.lg },
});
