import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { addMonths, formatMonthLong } from '@/utils/date';

import { AppText } from './AppText';

interface MonthSelectorProps {
  /** Any date inside the selected month. */
  value: Date;
  onChange: (value: Date) => void;
}

/** "‹ September 2026 ›" control. Can't go past the current month. */
export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const { colors } = useTheme();
  const now = new Date();
  const isCurrentMonth = value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(addMonths(value, -1))}
        hitSlop={12}
        accessibilityLabel="Previous month">
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>
      <AppText variant="heading" style={styles.label}>
        {formatMonthLong(value)}
      </AppText>
      <Pressable
        onPress={() => onChange(addMonths(value, 1))}
        disabled={isCurrentMonth}
        hitSlop={12}
        accessibilityLabel="Next month">
        <Ionicons name="chevron-forward" size={24} color={isCurrentMonth ? colors.border : colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  label: { flex: 1, textAlign: 'center' },
});
