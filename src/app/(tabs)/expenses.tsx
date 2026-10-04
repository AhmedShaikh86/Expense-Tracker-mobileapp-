import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ExpenseFilterModal } from '@/components/ExpenseFilterModal';
import { ExpenseRow } from '@/components/ExpenseRow';
import { FloatingButton } from '@/components/FloatingButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Radius, Spacing } from '@/constants/theme';
import { listExpenses } from '@/db/expenses';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { exportExpensesToCsv } from '@/services/export';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import type { ExpenseFilters, ExpenseWithCategory } from '@/types';
import { formatDateHeading } from '@/utils/date';
import { Alert } from '@/utils/alert';

interface Section {
  date: string;
  total: number;
  data: ExpenseWithCategory[];
}

/** Groups a date-sorted list into one section per day. */
function groupByDate(expenses: ExpenseWithCategory[]): Section[] {
  const sections: Section[] = [];
  for (const e of expenses) {
    const last = sections[sections.length - 1];
    if (last && last.date === e.date) {
      last.data.push(e);
      last.total += e.amount;
    } else {
      sections.push({ date: e.date, total: e.amount, data: [e] });
    }
  }
  return sections;
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { format, currency } = useCurrency();
  const navigation = useNavigation();
  const categories = useCategoriesStore((s) => s.categories);
  const removeExpense = useExpensesStore((s) => s.remove);

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // Wait until the user stops typing for 300 ms before searching.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const query = useMemo(() => ({ ...filters, search }), [filters, search]);
  const { data, isLoading, error, reload } = useAsyncData(() => listExpenses(query), [query]);
  const sections = useMemo(() => groupByDate(data ?? []), [data]);
  const total = useMemo(() => (data ?? []).reduce((sum, e) => sum + e.amount, 0), [data]);

  // How many filters are active (shown as a badge on the filter button).
  const activeFilterCount =
    (filters.categoryIds?.length ? 1 : 0) +
    (filters.fromDate || filters.toDate ? 1 : 0) +
    (filters.minAmount !== undefined || filters.maxAmount !== undefined ? 1 : 0);

  // Export button in the header exports exactly what is currently shown.
  useLayoutEffect(() => {
    const onExport = async () => {
      try {
        const count = await exportExpensesToCsv(currency.code, query);
        if (count === 0) Alert.alert('Nothing to export', 'There are no expenses in this list.');
      } catch (e) {
        Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
      }
    };
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={onExport}
          hitSlop={10}
          style={styles.headerButton}
          accessibilityLabel="Export CSV">
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, colors.primary, currency.code, query]);

  const confirmDelete = (expense: ExpenseWithCategory) => {
    Alert.alert(
      'Delete expense?',
      `${expense.categoryName} · ${format(expense.amount)}\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeExpense(expense.id).catch((e: unknown) =>
              Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error'),
            );
          },
        },
      ],
    );
  };

  const openExpense = (id: string) => router.push({ pathname: '/expense-form', params: { id } });
  const hasQuery = Boolean(search.trim()) || activeFilterCount > 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Search + filter bar */}
      <View style={styles.toolbar}>
        <View
          style={[styles.search, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search notes or categories"
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          style={[
            styles.filterButton,
            { backgroundColor: activeFilterCount ? colors.primary : colors.card, borderColor: colors.border },
          ]}
          accessibilityLabel="Filters">
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount ? colors.primaryText : colors.text}
          />
          {activeFilterCount > 0 && (
            <AppText variant="caption" bold color={colors.primaryText}>
              {activeFilterCount}
            </AppText>
          )}
        </Pressable>
      </View>

      {data && data.length > 0 && (
        <AppText variant="caption" muted style={styles.summary}>
          {data.length} expense{data.length === 1 ? '' : 's'} · Total {format(total)}
        </AppText>
      )}

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <AppText variant="label" muted>
                {formatDateHeading(section.date)}
              </AppText>
              <AppText variant="label" muted>
                {format(section.total)}
              </AppText>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: colors.card }]}>
              <ExpenseRow
                expense={item}
                onPress={() => openExpense(item.id)}
                onLongPress={() => confirmDelete(item)}
                onDelete={() => confirmDelete(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            hasQuery ? (
              <EmptyState
                icon="search-outline"
                title="No matches"
                message="Try a different search or clear the filters."
              />
            ) : (
              <EmptyState
                icon="receipt-outline"
                title="No expenses yet"
                message="Tap + to add your first expense."
                actionLabel="Add expense"
                onAction={() => router.push('/expense-form')}
              />
            )
          }
        />
      )}

      <FloatingButton onPress={() => router.push('/expense-form')} />

      <ExpenseFilterModal
        visible={filterOpen}
        categories={categories}
        filters={query}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          const { search: _ignored, ...rest } = f;
          setFilters(rest);
          setFilterOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toolbar: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: Spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 16 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 46,
  },
  summary: { paddingHorizontal: Spacing.lg },
  listContent: { padding: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 120, flexGrow: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  item: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
  headerButton: { paddingHorizontal: Spacing.lg },
});
