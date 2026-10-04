import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, parseISODate, toISODate } from '@/utils/date';

import { AppText } from './AppText';

interface DateFieldProps {
  label?: string;
  /** 'YYYY-MM-DD', or null for "not set". */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Show a small "x" to clear the value. */
  clearable?: boolean;
  maximumDate?: Date;
  error?: string;
}

/** A field that opens the native Android date picker dialog when tapped. */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  clearable,
  maximumDate,
  error,
}: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    // On Android the dialog closes by itself; hide our component either way.
    setOpen(false);
    if (event.type === 'set' && date) onChange(toISODate(date));
  };

  return (
    <View style={styles.wrapper}>
      {label && <AppText variant="label">{label}</AppText>}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.box,
          { backgroundColor: colors.inputBackground, borderColor: error ? colors.danger : colors.border },
        ]}>
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        <AppText style={styles.value} muted={!value}>
          {value ? formatDate(value) : placeholder}
        </AppText>
        {clearable && value && (
          <Pressable onPress={() => onChange(null)} hitSlop={10} accessibilityLabel="Clear date">
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </Pressable>
      {error && (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      )}
      {open && (
        <DateTimePicker
          value={value ? parseISODate(value) : new Date()}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs, flex: 1 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  value: { flex: 1 },
});
