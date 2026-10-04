import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MonthSelector } from '@/components/MonthSelector';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Spacing } from '@/constants/theme';
import { getCategoryTotals, getMonthlyTotals } from '@/db/expenses';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { addMonths, formatMonthShort, monthKey, monthRange } from '@/utils/date';
import { paisaToNumber } from '@/utils/money';

/** Category totals for the selected month + totals for the 6 months ending there. */
async function loadStats(month: Date) {
  const { start, end } = monthRange(month);
  const sixMonthsStart = monthRange(addMonths(month, -5)).start;
  const [byCategory, monthly] = await Promise.all([
    getCategoryTotals(start, end),
    getMonthlyTotals(sixMonthsStart, end),
  ]);

  // Fill in months without spending so the chart always shows 6 bars.
  const months = Array.from({ length: 6 }, (_, i) => monthKey(addMonths(month, i - 5)));
  const lastSix = months.map((key) => ({
    month: key,
    total: monthly.find((m) => m.month === key)?.total ?? 0,
  }));

  const spent = byCategory.filter((c) => c.total > 0);
  const monthTotal = spent.reduce((sum, c) => sum + c.total, 0);
  return { spent, monthTotal, lastSix };
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const { width } = useWindowDimensions();
  const [month, setMonth] = useState(() => new Date());
  const { data, isLoading, error, reload } = useAsyncData(() => loadStats(month), [month]);

  const selectedKey = monthKey(month);
  // Card inner width: screen minus screen padding and card padding.
  const chartWidth = width - Spacing.lg * 4 - 40;

  return (
    <Screen onRefresh={reload}>
      <MonthSelector value={month} onChange={setMonth} />

      {isLoading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          {/* Spending by category */}
          <Card style={styles.gap}>
            <AppText variant="heading">By category</AppText>
            {data.spent.length === 0 ? (
              <EmptyState icon="pie-chart-outline" title="No spending" message="No expenses in this month." />
            ) : (
              <>
                <View style={styles.center}>
                  <PieChart
                    data={data.spent.map((c) => ({ value: paisaToNumber(c.total), color: c.color }))}
                    donut
                    radius={100}
                    innerRadius={64}
                    innerCircleColor={colors.card}
                    centerLabelComponent={() => (
                      <View style={styles.center}>
                        <AppText variant="caption" muted>
                          Total
                        </AppText>
                        <AppText variant="label" bold>
                          {format(data.monthTotal, { compact: true })}
                        </AppText>
                      </View>
                    )}
                  />
                </View>
                {data.spent.map((c) => (
                  <View key={c.categoryId} style={styles.legendRow}>
                    <CategoryIcon icon={c.icon} color={c.color} size={30} />
                    <AppText style={styles.flex} numberOfLines={1}>
                      {c.name}
                    </AppText>
                    <AppText variant="caption" muted>
                      {Math.round((c.total / data.monthTotal) * 100)}%
                    </AppText>
                    <AppText variant="label">{format(c.total)}</AppText>
                  </View>
                ))}
              </>
            )}
          </Card>

          {/* Last 6 months */}
          <Card style={styles.gap}>
            <AppText variant="heading">Last 6 months</AppText>
            <BarChart
              data={data.lastSix.map((m) => ({
                value: paisaToNumber(m.total),
                label: formatMonthShort(m.month),
                frontColor: m.month === selectedKey ? colors.primary : colors.primarySoft,
              }))}
              width={chartWidth}
              height={180}
              barWidth={Math.max(16, chartWidth / 6 - 18)}
              spacing={14}
              initialSpacing={10}
              barBorderTopLeftRadius={6}
              barBorderTopRightRadius={6}
              noOfSections={4}
              yAxisThickness={0}
              xAxisColor={colors.border}
              rulesColor={colors.border}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
              formatYLabel={(label: string) => {
                const n = Number(label);
                // 1260 -> "1.3K", 45000 -> "45K"
                if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
                return String(Math.round(n));
              }}
              isAnimated
            />
            <View style={styles.monthTotals}>
              {data.lastSix.map((m) => (
                <View key={m.month} style={styles.monthTotalRow}>
                  <AppText variant="caption" muted>
                    {formatMonthShort(m.month)} {m.month.slice(0, 4)}
                  </AppText>
                  <AppText variant="caption" bold={m.month === selectedKey}>
                    {format(m.total)}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.md },
  center: { alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  monthTotals: { gap: 4 },
  monthTotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
