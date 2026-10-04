import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { toISODate } from '@/utils/date';

import { AppText } from './AppText';

/**
 * Web version of DateField.tsx (the Android date picker doesn't exist in
 * browsers). Uses the browser's own <input type="date">, whose value is
 * already in our 'YYYY-MM-DD' format.
 */
interface DateFieldProps {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
  maximumDate?: Date;
  error?: string;
}

export function DateField({ label, value, onChange, placeholder, maximumDate, error }: DateFieldProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.wrapper}>
      {label && <AppText variant="label">{label}</AppText>}
      {createElement('input', {
        type: 'date',
        value: value ?? '',
        placeholder,
        max: maximumDate ? toISODate(maximumDate) : undefined,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value || null),
        style: {
          minHeight: 48,
          padding: `0 ${Spacing.md}px`,
          borderRadius: Radius.md,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          backgroundColor: colors.inputBackground,
          color: colors.text,
          fontSize: 16,
          fontFamily: 'inherit',
          colorScheme: isDark ? 'dark' : 'light',
        },
      })}
      {error && (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs, flex: 1 },
});
