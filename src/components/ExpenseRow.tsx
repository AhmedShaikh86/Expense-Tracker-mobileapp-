import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import type { ExpenseWithCategory } from '@/types';
import { formatDate } from '@/utils/date';

import { AppText } from './AppText';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseRowProps {
  expense: ExpenseWithCategory;
  onPress?: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  showDate?: boolean;
}

/** One expense in a list: icon, category/note, amount and optional delete button. */
export function ExpenseRow({ expense, onPress, onLongPress, onDelete, showDate }: ExpenseRowProps) {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const subtitle = [expense.note, showDate ? formatDate(expense.date) : null].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <CategoryIcon icon={expense.categoryIcon} color={expense.categoryColor} />
      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <AppText variant="body" bold numberOfLines={1} style={styles.flexShrink}>
            {expense.categoryName}
          </AppText>
          {(expense.isRecurring || expense.recurringSourceId) && (
            <Ionicons name="repeat" size={14} color={colors.textSecondary} />
          )}
        </View>
        {subtitle ? (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <AppText variant="body" bold>
        {format(expense.amount)}
      </AppText>
      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel="Delete expense" style={styles.delete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  middle: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  flexShrink: { flexShrink: 1 },
  delete: { paddingLeft: Spacing.xs },
});
