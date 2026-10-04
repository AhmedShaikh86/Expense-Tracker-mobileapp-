import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { CategoryIcon } from '@/components/CategoryIcon';
import { FloatingButton } from '@/components/FloatingButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Radius, Spacing } from '@/constants/theme';
import { countExpensesInCategory } from '@/db/categories';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useCategoriesStore } from '@/store/categories';
import type { Category } from '@/types';
import { Alert } from '@/utils/alert';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const { categories, isLoading, error, load, remove } = useCategoriesStore();

  const edit = (id: string) => router.push({ pathname: '/category-form', params: { id } });

  const confirmDelete = async (category: Category) => {
    const count = await countExpensesInCategory(category.id);
    const moved = count > 0 ? `\n\n${count} expense${count === 1 ? '' : 's'} will be moved to "Other".` : '';
    Alert.alert(`Delete "${category.name}"?`, `This cannot be undone.${moved}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(category.id).catch((e: unknown) =>
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error'),
          );
        },
      },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No categories" message="Tap + to create one." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => edit(item.id)} style={[styles.row, { backgroundColor: colors.card }]}>
            <CategoryIcon icon={item.icon} color={item.color} />
            <View style={styles.flex}>
              <AppText bold>{item.name}</AppText>
              <AppText variant="caption" muted>
                {item.monthlyBudget ? `Budget ${format(item.monthlyBudget)} / month` : 'No budget'}
                {item.isDefault ? ' · Default' : ''}
              </AppText>
            </View>
            {!item.isDefault && (
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={10}
                accessibilityLabel={`Delete ${item.name}`}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      />
      <FloatingButton label="Add category" onPress={() => router.push('/category-form')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
});
