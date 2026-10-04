import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BudgetModal } from '@/components/BudgetModal';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MonthSelector } from '@/components/MonthSelector';
import { getBudgetLevel, ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Spacing } from '@/constants/theme';
import { getCategoryTotals } from '@/db/expenses';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useCategoriesStore } from '@/store/categories';
import type { CategoryTotal } from '@/types';
import { monthRange } from '@/utils/date';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const setBudget = useCategoriesStore((s) => s.setBudget);
  const [month, setMonth] = useState(() => new Date());
  const [editing, setEditing] = useState<CategoryTotal | null>(null);

  const { data, isLoading, error, reload } = useAsyncData(() => {
    const { start, end } = monthRange(month);
    return getCategoryTotals(start, end);
  }, [month]);

  const budgeted = (data ?? []).filter((c) => c.monthlyBudget && c.monthlyBudget > 0);
  const unbudgeted = (data ?? []).filter((c) => !c.monthlyBudget);
  const totalBudget = budgeted.reduce((s, c) => s + (c.monthlyBudget ?? 0), 0);
  const totalSpent = budgeted.reduce((s, c) => s + c.total, 0);

  /** One category row with its progress bar and status message. */
  const renderBudget = (c: CategoryTotal) => {
    const budget = c.monthlyBudget ?? 0;
    const level = getBudgetLevel(c.total, budget);
    const remaining = budget - c.total;
    const statusColor =
      level === 'over' ? colors.danger : level === 'warning' ? colors.warning : colors.textSecondary;
    const statusText =
      level === 'over'
        ? `Over budget by ${format(-remaining)}`
        : level === 'warning'
          ? `Almost there! ${format(remaining)} left`
          : `${format(remaining)} left`;

    return (
      <Pressable key={c.categoryId} onPress={() => setEditing(c)} style={styles.budgetRow}>
        <View style={styles.rowTop}>
          <CategoryIcon icon={c.icon} color={c.color} size={34} />
          <AppText style={styles.flex} bold numberOfLines={1}>
            {c.name}
          </AppText>
          <AppText variant="label">
            {format(c.total)} / {format(budget)}
          </AppText>
        </View>
        <ProgressBar progress={budget ? c.total / budget : 0} />
        <View style={styles.statusRow}>
          {level !== 'ok' && (
            <Ionicons name={level === 'over' ? 'alert-circle' : 'warning'} size={14} color={statusColor} />
          )}
          <AppText variant="caption" color={statusColor}>
            {statusText}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen onRefresh={reload}>
      <MonthSelector value={month} onChange={setMonth} />

      {isLoading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          {budgeted.length > 0 ? (
            <>
              <Card style={styles.gap}>
                <AppText variant="label" muted>
                  Total budget
                </AppText>
                <AppText variant="title">{format(totalSpent)}</AppText>
                <AppText muted>of {format(totalBudget)}</AppText>
                <ProgressBar progress={totalBudget ? totalSpent / totalBudget : 0} height={10} />
              </Card>
              <Card style={styles.gap}>
                <AppText variant="heading">Category budgets</AppText>
                {budgeted.map(renderBudget)}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                icon="wallet-outline"
                title="No budgets yet"
                message="Tap a category below to set a monthly budget."
              />
            </Card>
          )}

          {unbudgeted.length > 0 && (
            <Card style={styles.gap}>
              <AppText variant="heading">No budget set</AppText>
              {unbudgeted.map((c) => (
                <Pressable key={c.categoryId} onPress={() => setEditing(c)} style={styles.rowTop}>
                  <CategoryIcon icon={c.icon} color={c.color} size={34} />
                  <View style={styles.flex}>
                    <AppText numberOfLines={1}>{c.name}</AppText>
                    <AppText variant="caption" muted>
                      Spent {format(c.total)}
                    </AppText>
                  </View>
                  <AppText variant="label" color={colors.primary}>
                    Set budget
                  </AppText>
                </Pressable>
              ))}
            </Card>
          )}
        </>
      )}

      <BudgetModal
        visible={editing !== null}
        categoryName={editing?.name ?? ''}
        budget={editing?.monthlyBudget ?? null}
        // `editing` is null while the dialog is closed, so never read it unguarded.
        onSave={(value) => (editing ? setBudget(editing.categoryId, value) : Promise.resolve())}
        onClose={() => setEditing(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.md },
  budgetRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
