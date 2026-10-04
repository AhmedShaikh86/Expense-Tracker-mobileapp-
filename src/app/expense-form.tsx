import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, Switch, View } from 'react-native';
import { z } from 'zod';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Spacing } from '@/constants/theme';
import { getCategoryTotals, getExpense } from '@/db/expenses';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import type { ExpenseInput } from '@/types';
import { monthRange, ordinal, parseISODate, todayISO } from '@/utils/date';
import { formatMoney, paisaToInputString, parseAmountToPaisa } from '@/utils/money';
import { Alert } from '@/utils/alert';
import { goBack } from '@/utils/navigation';

/**
 * Form validation rules. Amount is kept as text while typing and converted
 * to paisa on save (see parseAmountToPaisa).
 */
const schema = z
  .object({
    amount: z
      .string()
      .trim()
      .min(1, 'Enter an amount')
      .refine((v) => parseAmountToPaisa(v) !== null, 'Enter a valid amount (max 2 decimals)')
      .refine((v) => (parseAmountToPaisa(v) ?? 0) > 0, 'Amount must be greater than 0')
      .refine((v) => (parseAmountToPaisa(v) ?? 0) <= 100_000_000_00, 'Amount is too large'),
    categoryId: z.string().min(1, 'Choose a category'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
    note: z.string().max(200, 'Note is too long (max 200 characters)'),
    isRecurring: z.boolean(),
    recurringDay: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.isRecurring) return;
    const day = Number(values.recurringDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      ctx.addIssue({ code: 'custom', path: ['recurringDay'], message: 'Enter a day between 1 and 31' });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function ExpenseFormScreen() {
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string; recurring?: string }>();
  const editingId = params.id;
  const categories = useCategoriesStore((s) => s.categories);
  const { add, update, remove } = useExpensesStore();

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(editingId ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      categoryId: '',
      date: todayISO(),
      note: '',
      isRecurring: params.recurring === '1',
      recurringDay: String(new Date().getDate()),
    },
  });

  const isRecurring = useWatch({ control, name: 'isRecurring' });

  useLayoutEffect(() => {
    navigation.setOptions({ title: editingId ? 'Edit expense' : 'Add expense' });
  }, [navigation, editingId]);

  // When editing, load the expense and fill the form.
  useEffect(() => {
    if (!editingId) return;
    getExpense(editingId)
      .then((expense) => {
        if (!expense) throw new Error('This expense no longer exists.');
        reset({
          amount: paisaToInputString(expense.amount),
          categoryId: expense.categoryId,
          date: expense.date,
          note: expense.note,
          isRecurring: expense.isRecurring,
          recurringDay: String(expense.recurringDay ?? parseISODate(expense.date).getDate()),
        });
        setLoadState('ready');
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : 'Could not load expense');
        setLoadState('error');
      });
  }, [editingId, reset]);

  const onSubmit = async (values: FormValues) => {
    const input: ExpenseInput = {
      amount: parseAmountToPaisa(values.amount) ?? 0,
      categoryId: values.categoryId,
      date: values.date,
      note: values.note,
      isRecurring: values.isRecurring,
      recurringDay: values.isRecurring ? Number(values.recurringDay) : null,
    };
    try {
      // Budget before saving, so we can tell if this expense crossed 80% / 100%.
      const before = await getCategorySpending(input.categoryId, input.date);
      if (editingId) await update(editingId, input);
      else await add(input);
      const after = await getCategorySpending(input.categoryId, input.date);
      goBack();
      showBudgetAlert(before, after);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  /** Alerts the user when this expense pushed a category over 80% or 100% of its budget. */
  const showBudgetAlert = (before: Spending | null, after: Spending | null) => {
    if (!before || !after || !after.budget) return;
    const fmt = (p: number) => formatMoney(p, currency.symbol);
    const ratioBefore = before.total / after.budget;
    const ratioAfter = after.total / after.budget;
    if (ratioAfter >= 1 && ratioBefore < 1) {
      Alert.alert(
        'Budget exceeded',
        `You've spent ${fmt(after.total)} on ${after.name} this month — over your ${fmt(after.budget)} budget.`,
      );
    } else if (ratioAfter >= 0.8 && ratioBefore < 0.8) {
      Alert.alert(
        'Budget warning',
        `You've used ${Math.round(ratioAfter * 100)}% of your ${after.name} budget (${fmt(after.budget)}).`,
      );
    }
  };

  const onDelete = () => {
    if (!editingId) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(editingId);
            goBack();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  if (loadState === 'loading') return <LoadingState />;
  if (loadState === 'error') return <ErrorState message={loadError} onRetry={goBack} />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Amount"
              prefix={currency.symbol}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0"
              keyboardType="decimal-pad"
              autoFocus={!editingId}
              style={styles.amountInput}
              error={errors.amount?.message}
            />
          )}
        />

        <View style={styles.field}>
          <AppText variant="label">Category</AppText>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { value, onChange } }) => (
              <CategoryPicker categories={categories} value={value} onChange={onChange} />
            )}
          />
          {errors.categoryId && (
            <AppText variant="caption" color={colors.danger}>
              {errors.categoryId.message}
            </AppText>
          )}
        </View>

        <Controller
          control={control}
          name="date"
          render={({ field: { value, onChange } }) => (
            <DateField
              label="Date"
              value={value}
              onChange={(v) => {
                if (!v) return;
                onChange(v);
                // Default the recurring day to the chosen date's day.
                if (!isRecurring) setValue('recurringDay', String(parseISODate(v).getDate()));
              }}
              maximumDate={isRecurring ? undefined : new Date()}
              error={errors.date?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Note (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. Lunch with friends"
              maxLength={200}
              error={errors.note?.message}
            />
          )}
        />

        <Card style={styles.field}>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <AppText bold>Repeat monthly</AppText>
              <AppText variant="caption" muted>
                For rent, bills and subscriptions
              </AppText>
            </View>
            <Controller
              control={control}
              name="isRecurring"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ true: colors.primary, false: colors.track }}
                  thumbColor="#FFFFFF"
                />
              )}
            />
          </View>
          {isRecurring && (
            <Controller
              control={control}
              name="recurringDay"
              render={({ field: { value, onChange, onBlur } }) => (
                <>
                  <Input
                    label="Day of month"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={2}
                    error={errors.recurringDay?.message}
                  />
                  {!errors.recurringDay && Number(value) >= 1 && Number(value) <= 31 && (
                    <AppText variant="caption" muted>
                      A copy is added automatically on the {ordinal(Number(value))} of every month
                      {Number(value) > 28 ? ' (or the last day in shorter months)' : ''}.
                    </AppText>
                  )}
                </>
              )}
            />
          )}
        </Card>

        <Button
          title={editingId ? 'Save changes' : 'Add expense'}
          icon="checkmark"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
        {editingId && <Button title="Delete expense" variant="ghost" onPress={onDelete} />}
      </Screen>
    </KeyboardAvoidingView>
  );
}

interface Spending {
  name: string;
  total: number;
  budget: number | null;
}

/** Spending and budget of one category in the month containing `date`. */
async function getCategorySpending(categoryId: string, date: string): Promise<Spending | null> {
  const { start, end } = monthRange(parseISODate(date));
  const totals = await getCategoryTotals(start, end);
  const found = totals.find((t) => t.categoryId === categoryId);
  return found ? { name: found.name, total: found.total, budget: found.monthlyBudget } : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.sm },
  amountInput: { fontSize: 24, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
