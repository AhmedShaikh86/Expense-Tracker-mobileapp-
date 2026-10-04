/**
 * Default categories seeded on first launch, plus the icon and color
 * choices offered when the user creates a custom category.
 *
 * Default categories use fixed ids so the same category on two devices
 * merges into one row when syncing to the cloud.
 */

export interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'default-food', name: 'Food', icon: 'fast-food', color: '#F97316' },
  { id: 'default-transport', name: 'Transport', icon: 'car', color: '#3B82F6' },
  { id: 'default-bills', name: 'Bills', icon: 'receipt', color: '#EF4444' },
  { id: 'default-shopping', name: 'Shopping', icon: 'bag-handle', color: '#EC4899' },
  { id: 'default-health', name: 'Health', icon: 'medkit', color: '#10B981' },
  { id: 'default-entertainment', name: 'Entertainment', icon: 'film', color: '#8B5CF6' },
  { id: 'default-education', name: 'Education', icon: 'school', color: '#0EA5E9' },
  { id: 'default-other', name: 'Other', icon: 'ellipsis-horizontal-circle', color: '#6B7280' },
];

/** Icons the user can choose for a custom category (Ionicons names). */
export const CATEGORY_ICONS: string[] = [
  'fast-food',
  'restaurant',
  'cafe',
  'pizza',
  'car',
  'bus',
  'airplane',
  'bicycle',
  'receipt',
  'flash',
  'water',
  'wifi',
  'phone-portrait',
  'home',
  'bag-handle',
  'cart',
  'shirt',
  'gift',
  'medkit',
  'fitness',
  'heart',
  'film',
  'game-controller',
  'musical-notes',
  'school',
  'book',
  'briefcase',
  'paw',
  'people',
  'construct',
  'card',
  'cash',
  'barbell',
  'color-palette',
  'globe',
  'ellipsis-horizontal-circle',
];

/** Colors the user can choose for a custom category. */
export const CATEGORY_COLORS: string[] = [
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#D946EF',
  '#8B5CF6',
  '#6366F1',
  '#3B82F6',
  '#0EA5E9',
  '#14B8A6',
  '#10B981',
  '#84CC16',
  '#EAB308',
  '#A16207',
  '#78716C',
  '#6B7280',
  '#0F172A',
];
