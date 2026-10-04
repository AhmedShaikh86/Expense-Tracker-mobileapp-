import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/store/settings';

/**
 * Returns the active color palette.
 * Theme mode comes from Settings: 'system' follows the phone, otherwise forced.
 */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  return { colors: isDark ? Colors.dark : Colors.light, isDark };
}
