import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';

interface AppTextProps extends TextProps {
  variant?: Variant;
  /** Use the secondary (grey) text color. */
  muted?: boolean;
  color?: string;
  bold?: boolean;
}

/** Text that uses the theme colors and a consistent type scale. */
export function AppText({ variant = 'body', muted, color, bold, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        styles[variant],
        { color: color ?? (muted ? colors.textSecondary : colors.text) },
        bold && styles.bold,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSize.xxl, fontWeight: '700' },
  heading: { fontSize: FontSize.lg, fontWeight: '700' },
  body: { fontSize: FontSize.md },
  label: { fontSize: FontSize.sm, fontWeight: '600' },
  caption: { fontSize: FontSize.xs },
  bold: { fontWeight: '700' },
});
