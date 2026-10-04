import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

interface ListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Custom element on the right (default: a chevron when pressable). */
  right?: ReactNode;
  destructive?: boolean;
}

/** A settings-style row: icon, title, optional subtitle and chevron. */
export function ListItem({ icon, title, subtitle, onPress, right, destructive }: ListItemProps) {
  const { colors } = useTheme();
  const tint = destructive ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={22} color={tint} />
      <View style={styles.text}>
        <AppText color={destructive ? colors.danger : undefined}>{title}</AppText>
        {subtitle && (
          <AppText variant="caption" muted>
            {subtitle}
          </AppText>
        )}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  text: { flex: 1, gap: 2 },
});
