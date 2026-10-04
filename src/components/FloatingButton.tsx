import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** Round "+" button floating in the bottom-right corner. */
export function FloatingButton({ onPress, label = 'Add expense' }: { onPress: () => void; label?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}>
      <Ionicons name="add" size={30} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.3)',
  },
});
