/**
 * Central theme: colors for light and dark mode, spacing, radius and font sizes.
 * Components read colors through the `useTheme()` hook so they switch
 * automatically when the user changes the theme in Settings.
 */

export const Colors = {
  light: {
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    primarySoft: '#DBEAFE',
    background: '#F4F6FA',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    inputBackground: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    track: '#E5E7EB',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    primary: '#60A5FA',
    primaryText: '#0B1220',
    primarySoft: '#1E3A5F',
    background: '#0B0F17',
    card: '#161B26',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    border: '#262D3B',
    inputBackground: '#1C2230',
    danger: '#F87171',
    dangerSoft: '#3F1D1D',
    warning: '#FBBF24',
    warningSoft: '#3D2E0A',
    success: '#4ADE80',
    successSoft: '#12351F',
    track: '#2A3242',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

/** The shape of one color palette (light or dark). */
export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 30,
} as const;
