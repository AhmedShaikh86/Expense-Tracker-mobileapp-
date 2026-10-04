import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { FloatingButton } from '@/components/FloatingButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Radius, Spacing } from '@/constants/theme';
import { getRecurringExpenses } from '@/db/expenses';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useExpensesStore } from '@/store/expenses';
import type { ExpenseWithCategory } from '@/types';
import { daysInMonth, formatDate, ordinal, toISODate } from '@/utils/date';
import { Alert } from '@/utils/alert';

/** Date of the next automatic entry for a recurring day. */
function nextDueDate(day: number): string {
  const today = new Date();
  const dueThisMonth = Math.min(day, daysInMonth(today.getFullYear(), today.getMonth()));
  if (dueThisMonth > today.getDate()) {
    return toISODate(new Date(today.getFullYear(), today.getMonth(), dueThisMonth));
  }
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const dueNext = Math.min(day, daysInMonth(next.getFullYear(), next.getMonth()));
  return toISODate(new Date(next.getFullYear(), next.getMonth(), dueNext));
}

export default function RecurringScreen() {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const stopRecurring = useExpensesStore((s) => s.stopRecurring);
  const { data, isLoading, error, reload } = useAsyncData(getRecurringExpenses, []);

  const addRecurring = () => router.push({ pathname: '/expense-form', params: { recurring: '1' } });

  const confirmStop = (e: ExpenseWithCategory) => {
    Alert.alert(
      'Stop repeating?',
      `No new "${e.categoryName}" entries will be created. Entries already added are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            stopRecurring(e.id).catch((err: unknown) =>
              Alert.alert('Failed', err instanceof Error ? err.message : 'Unknown error'),
            );
          },
        },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const total = (data ?? []).reduce((s, e) => s + e.amount, 0);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          data && data.length > 0 ? (
            <AppText muted>
              {data.length} recurring · {format(total)} per month. New entries are added automatically when
              you open the app.
            </AppText>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="repeat-outline"
            title="No recurring expenses"
            message='Turn on "Repeat monthly" when adding an expense (e.g. rent or bills) and it will be added every month automatically.'
            actionLabel="Add recurring expense"
            onAction={addRecurring}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/expense-form', params: { id: item.id } })}
            style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <CategoryIcon icon={item.categoryIcon} color={item.categoryColor} />
              <View style={styles.flex}>
                <AppText bold numberOfLines={1}>
                  {item.note || item.categoryName}
                </AppText>
                <AppText variant="caption" muted>
                  Every month on the {ordinal(item.recurringDay ?? 1)} · Next{' '}
                  {formatDate(nextDueDate(item.recurringDay ?? 1))}
                </AppText>
              </View>
              <AppText bold>{format(item.amount)}</AppText>
            </View>
            <Button title="Stop repeating" variant="ghost" onPress={() => confirmStop(item)} />
          </Pressable>
        )}
      />
      {data && data.length > 0 && <FloatingButton label="Add recurring expense" onPress={addRecurring} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 120, flexGrow: 1 },
  card: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
