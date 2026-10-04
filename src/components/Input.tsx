import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label?: string;
  /** Validation message shown in red under the field. */
  error?: string;
  /** Text shown before the value, e.g. the currency symbol. */
  prefix?: string;
}

/** Labeled text input with an optional error message. */
export function Input({ label, error, prefix, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.box,
          { backgroundColor: colors.inputBackground, borderColor: error ? colors.danger : colors.border },
        ]}>
        {prefix && (
          <AppText muted style={styles.prefix}>
            {prefix}
          </AppText>
        )}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />
      </View>
      {error && (
        <AppText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: { marginBottom: 2 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  prefix: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md, paddingVertical: Spacing.md },
  error: { marginTop: 2 },
});
