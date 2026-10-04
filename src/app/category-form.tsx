import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon, toIconName } from '@/components/CategoryIcon';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { ErrorState } from '@/components/StateViews';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useCategoriesStore } from '@/store/categories';
import { paisaToInputString, parseAmountToPaisa } from '@/utils/money';
import { Alert } from '@/utils/alert';
import { goBack } from '@/utils/navigation';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(30, 'Max 30 characters'),
  icon: z.string().min(1),
  color: z.string().min(1),
  budget: z
    .string()
    .trim()
    .refine((v) => v === '' || (parseAmountToPaisa(v) ?? 0) > 0, 'Enter a valid amount or leave empty'),
});

type FormValues = z.infer<typeof schema>;

export default function CategoryFormScreen() {
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { categories, add, update } = useCategoriesStore();
  const existing = id ? categories.find((c) => c.id === id) : undefined;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name ?? '',
      icon: existing?.icon ?? CATEGORY_ICONS[0],
      color: existing?.color ?? CATEGORY_COLORS[0],
      budget: existing?.monthlyBudget ? paisaToInputString(existing.monthlyBudget) : '',
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? 'Edit category' : 'New category' });
  }, [navigation, id]);

  const [name, icon, color] = useWatch({ control, name: ['name', 'icon', 'color'] });

  const onSubmit = async (values: FormValues) => {
    // Category names must be unique (ignoring upper/lower case).
    const duplicate = categories.some(
      (c) => c.id !== id && c.name.toLowerCase() === values.name.trim().toLowerCase(),
    );
    if (duplicate) {
      setError('name', { message: 'A category with this name already exists' });
      return;
    }
    const input = {
      name: values.name,
      icon: values.icon,
      color: values.color,
      monthlyBudget: values.budget ? parseAmountToPaisa(values.budget) : null,
    };
    try {
      if (id) await update(id, input);
      else await add(input);
      goBack();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  if (id && !existing) return <ErrorState message="This category no longer exists." onRetry={goBack} />;

  return (
    <Screen>
      {/* Live preview */}
      <Card style={styles.preview}>
        <CategoryIcon icon={icon} color={color} size={56} />
        <AppText variant="heading">{name.trim() || 'Category name'}</AppText>
      </Card>

      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Groceries"
            maxLength={30}
            error={errors.name?.message}
          />
        )}
      />

      <View style={styles.field}>
        <AppText variant="label">Icon</AppText>
        <Controller
          control={control}
          name="icon"
          render={({ field: { value, onChange } }) => (
            <View style={styles.grid}>
              {CATEGORY_ICONS.map((i) => {
                const selected = i === value;
                return (
                  <Pressable
                    key={i}
                    onPress={() => onChange(i)}
                    accessibilityLabel={`Icon ${i}`}
                    style={[
                      styles.iconCell,
                      {
                        borderColor: selected ? color : colors.border,
                        backgroundColor: selected ? `${color}22` : colors.card,
                      },
                    ]}>
                    <Ionicons
                      name={toIconName(i)}
                      size={22}
                      color={selected ? color : colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      <View style={styles.field}>
        <AppText variant="label">Color</AppText>
        <Controller
          control={control}
          name="color"
          render={({ field: { value, onChange } }) => (
            <View style={styles.grid}>
              {CATEGORY_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => onChange(c)}
                  accessibilityLabel={`Color ${c}`}
                  style={[
                    styles.colorCell,
                    { backgroundColor: c, borderColor: c === value ? colors.text : 'transparent' },
                  ]}>
                  {c === value && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="budget"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Monthly budget (optional)"
            prefix={currency.symbol}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="No budget"
            keyboardType="decimal-pad"
            error={errors.budget?.message}
          />
        )}
      />

      <Button
        title={id ? 'Save changes' : 'Create category'}
        icon="checkmark"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', gap: Spacing.sm },
  field: { gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
