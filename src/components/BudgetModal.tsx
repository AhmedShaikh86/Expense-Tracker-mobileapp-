import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { paisaToInputString, parseAmountToPaisa } from '@/utils/money';

import { AppText } from './AppText';
import { Button } from './Button';
import { Input } from './Input';

interface BudgetModalProps {
  visible: boolean;
  categoryName: string;
  /** Current budget in paisa, or null. */
  budget: number | null;
  onSave: (budget: number | null) => Promise<void>;
  onClose: () => void;
}

/** Small dialog to set or remove a category's monthly budget. */
export function BudgetModal({ visible, onClose, ...rest }: BudgetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Mounted only while open, so the form starts fresh each time. */}
      {visible && <BudgetDialog onClose={onClose} {...rest} />}
    </Modal>
  );
}

function BudgetDialog({ categoryName, budget, onSave, onClose }: Omit<BudgetModalProps, 'visible'>) {
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const [text, setText] = useState(budget ? paisaToInputString(budget) : '');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const save = async (value: number | null) => {
    setSaving(true);
    try {
      await onSave(value);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save budget');
    } finally {
      setSaving(false);
    }
  };

  const submit = () => {
    const paisa = parseAmountToPaisa(text);
    if (paisa === null || paisa <= 0) return setError('Enter an amount greater than 0.');
    save(paisa);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
      <View style={[styles.dialog, { backgroundColor: colors.card }]}>
        <AppText variant="heading">{categoryName} budget</AppText>
        <AppText muted>Monthly limit. You&apos;ll be warned at 80% and alerted at 100%.</AppText>
        <Input
          value={text}
          onChangeText={setText}
          prefix={currency.symbol}
          placeholder="0"
          keyboardType="decimal-pad"
          autoFocus
          error={error}
        />
        <View style={styles.row}>
          <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.flex} />
          <Button title="Save" onPress={submit} loading={saving} style={styles.flex} />
        </View>
        {budget !== null && (
          <Button title="Remove budget" variant="ghost" onPress={() => save(null)} disabled={saving} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  dialog: { borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
