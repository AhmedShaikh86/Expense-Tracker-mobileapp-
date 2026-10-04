import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** Budget warning levels. */
export type BudgetLevel = 'ok' | 'warning' | 'over';

/** 'warning' at 80% of the budget, 'over' at 100% or more. */
export function getBudgetLevel(spent: number, budget: number): BudgetLevel {
  if (budget <= 0) return 'ok';
  const ratio = spent / budget;
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}

interface ProgressBarProps {
  /** 0..1 (values above 1 are shown as a full bar). */
  progress: number;
  /** Override the color; defaults to green/amber/red by progress. */
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const autoColor = progress >= 1 ? colors.danger : progress >= 0.8 ? colors.warning : colors.success;
  return (
    <View style={[styles.track, { backgroundColor: colors.track, height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height,
          borderRadius: Radius.pill,
          backgroundColor: color ?? autoColor,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
