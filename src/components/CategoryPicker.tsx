import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types';

import { AppText } from './AppText';
import { CategoryIcon } from './CategoryIcon';

interface CategoryPickerProps {
  categories: Category[];
  /** Selected id, or an array of ids for multi-select. */
  value: string | string[] | null;
  onChange: (id: string) => void;
}

/** A grid of tappable category tiles with icons. */
export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const { colors } = useTheme();
  const isSelected = (id: string) => (Array.isArray(value) ? value.includes(id) : value === id);

  return (
    <View style={styles.grid}>
      {categories.map((c) => {
        const selected = isSelected(c.id);
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.tile,
              {
                borderColor: selected ? c.color : colors.border,
                backgroundColor: selected ? `${c.color}1A` : colors.card,
              },
            ]}>
            <CategoryIcon icon={c.icon} color={c.color} size={36} />
            <AppText variant="caption" numberOfLines={1} bold={selected} style={styles.name}>
              {c.name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '23%',
    flexGrow: 1,
    maxWidth: '25%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  name: { textAlign: 'center' },
});
