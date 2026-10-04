import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ExpenseRow } from '@/components/ExpenseRow';
import { FloatingButton } from '@/components/FloatingButton';
import { getBudgetLevel, ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { DEVELOPER_NAME } from '@/constants/app';
import { Spacing } from '@/constants/theme';
import { getCategoryTotals, getRecentExpenses, getTotalBetween } from '@/db/expenses';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { formatMonthLong, monthRange } from '@/utils/date';

/** Loads everything the dashboard needs in one go. */
async function loadDashboard() {
  const { start, end } = monthRange(new Date());
  const [monthTotal, categoryTotals, recent] = await Promise.all([
    getTotalBetween(start, end),
    getCategoryTotals(start, end),
    getRecentExpenses(5),
  ]);
  const budgeted = categoryTotals.filter((c) => c.monthlyBudget && c.monthlyBudget > 0);
  const totalBudget = budgeted.reduce((sum, c) => sum + (c.monthlyBudget ?? 0), 0);
  const budgetedSpent = budgeted.reduce((sum, c) => sum + c.total, 0);
  // Categories at 80% or more of their budget.
  const alerts = budgeted
    .map((c) => ({ ...c, level: getBudgetLevel(c.total, c.monthlyBudget ?? 0) }))
    .filter((c) => c.level !== 'ok');
  return { monthTotal, totalBudget, budgetedSpent, alerts, recent };
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const { data, isLoading, error, reload } = useAsyncData(loadDashboard, []);

  const addExpense = () => router.push('/expense-form');

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={reload} />;

  const budgetRatio = data.totalBudget > 0 ? data.budgetedSpent / data.totalBudget : 0;

  return (
    <View style={styles.flex}>
      <Screen onRefresh={reload}>
        {/* This month's total */}
        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
          <AppText variant="label" color={colors.primaryText} style={styles.faded}>
            Spent in {formatMonthLong(new Date())}
          </AppText>
          <AppText variant="title" color={colors.primaryText} style={styles.total}>
            {format(data.monthTotal)}
          </AppText>
          {data.totalBudget > 0 ? (
            <View style={styles.budgetBox}>
              <ProgressBar progress={budgetRatio} color={colors.primaryText} />
              <AppText variant="caption" color={colors.primaryText} style={styles.faded}>
                {Math.round(budgetRatio * 100)}% of {format(data.totalBudget)} budget used
              </AppText>
            </View>
          ) : (
            <Pressable onPress={() => router.push('/budgets')}>
              <AppText variant="caption" color={colors.primaryText} style={styles.faded}>
                No budgets set yet · Tap to set one
              </AppText>
            </Pressable>
          )}
        </Card>

        <Button title="Add expense" icon="add-circle-outline" onPress={addExpense} />

        {/* Budget warnings (80%) and alerts (100%) */}
        {data.alerts.length > 0 && (
          <Card style={styles.gap}>
            <AppText variant="heading">Budget alerts</AppText>
            {data.alerts.map((a) => {
              const over = a.level === 'over';
              return (
                <View key={a.categoryId} style={styles.alertRow}>
                  <CategoryIcon icon={a.icon} color={a.color} size={32} />
                  <AppText style={styles.flex} numberOfLines={1}>
                    {a.name}
                  </AppText>
                  <Ionicons
                    name={over ? 'alert-circle' : 'warning'}
                    size={18}
                    color={over ? colors.danger : colors.warning}
                  />
                  <AppText variant="label" color={over ? colors.danger : colors.warning}>
                    {Math.round((a.total / (a.monthlyBudget ?? 1)) * 100)}%
                  </AppText>
                </View>
              );
            })}
          </Card>
        )}

        {/* Recent expenses */}
        <Card>
          <View style={styles.sectionHeader}>
            <AppText variant="heading">Recent expenses</AppText>
            {data.recent.length > 0 && (
              <Pressable onPress={() => router.push('/expenses')} hitSlop={8}>
                <AppText variant="label" color={colors.primary}>
                  See all
                </AppText>
              </Pressable>
            )}
          </View>
          {data.recent.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No expenses yet"
              message="Add your first expense to start tracking."
            />
          ) : (
            data.recent.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                showDate
                onPress={() => router.push({ pathname: '/expense-form', params: { id: e.id } })}
              />
            ))
          )}
        </Card>

        <AppText variant="caption" muted style={styles.credit}>
          Made with ❤️ by {DEVELOPER_NAME}
        </AppText>
      </Screen>
      <FloatingButton onPress={addExpense} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  credit: { textAlign: 'center' },
  faded: { opacity: 0.85 },
  total: { marginVertical: Spacing.sm },
  budgetBox: { gap: Spacing.xs, marginTop: Spacing.xs },
  gap: { gap: Spacing.sm },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
});
