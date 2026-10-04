import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import type { Category, ExpenseFilters } from '@/types';
import { paisaToInputString, parseAmountToPaisa } from '@/utils/money';

import { AppText } from './AppText';
import { Button } from './Button';
import { CategoryPicker } from './CategoryPicker';
import { DateField } from './DateField';
import { Input } from './Input';

interface ExpenseFilterModalProps {
  visible: boolean;
  categories: Category[];
  filters: ExpenseFilters;
  onApply: (filters: ExpenseFilters) => void;
  onClose: () => void;
}

/** Bottom sheet for filtering expenses by category, date range and amount. */
export function ExpenseFilterModal({ visible, onClose, ...rest }: ExpenseFilterModalProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        {/* Mounted only while open, so the draft starts from the current filters. */}
        {visible && <FilterSheet onClose={onClose} {...rest} />}
      </View>
    </Modal>
  );
}

function FilterSheet({ categories, filters, onApply, onClose }: Omit<ExpenseFilterModalProps, 'visible'>) {
  const { colors } = useTheme();
  const { currency } = useCurrency();

  // Local draft so changes only apply when the user taps "Apply".
  const [categoryIds, setCategoryIds] = useState<string[]>(filters.categoryIds ?? []);
  const [fromDate, setFromDate] = useState<string | null>(filters.fromDate ?? null);
  const [toDate, setToDate] = useState<string | null>(filters.toDate ?? null);
  const [minText, setMinText] = useState(
    filters.minAmount !== undefined ? paisaToInputString(filters.minAmount) : '',
  );
  const [maxText, setMaxText] = useState(
    filters.maxAmount !== undefined ? paisaToInputString(filters.maxAmount) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (id: string) =>
    setCategoryIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const apply = () => {
    const minAmount = minText.trim() ? parseAmountToPaisa(minText) : undefined;
    const maxAmount = maxText.trim() ? parseAmountToPaisa(maxText) : undefined;
    if (minAmount === null || maxAmount === null) return setError('Enter valid amounts.');
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      return setError('Minimum amount is larger than maximum.');
    }
    if (fromDate && toDate && fromDate > toDate) return setError('"From" date is after "To" date.');

    onApply({
      search: filters.search,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined,
      minAmount,
      maxAmount,
    });
  };

  const reset = () => onApply({ search: filters.search });

  return (
    <View style={[styles.sheet, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="heading">Filter expenses</AppText>

        <AppText variant="label">Categories</AppText>
        <CategoryPicker categories={categories} value={categoryIds} onChange={toggleCategory} />

        <AppText variant="label">Date range</AppText>
        <View style={styles.row}>
          <DateField value={fromDate} onChange={setFromDate} placeholder="From" clearable />
          <DateField value={toDate} onChange={setToDate} placeholder="To" clearable />
        </View>

        <AppText variant="label">Amount ({currency.symbol})</AppText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Input value={minText} onChangeText={setMinText} placeholder="Min" keyboardType="decimal-pad" />
          </View>
          <View style={styles.flex}>
            <Input value={maxText} onChangeText={setMaxText} placeholder="Max" keyboardType="decimal-pad" />
          </View>
        </View>

        {error && <AppText color={colors.danger}>{error}</AppText>}

        <View style={styles.row}>
          <Button title="Reset" variant="secondary" onPress={reset} style={styles.flex} />
          <Button title="Apply" onPress={apply} style={styles.flex} />
        </View>
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  content: { padding: Spacing.lg, gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
