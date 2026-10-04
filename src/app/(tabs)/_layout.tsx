import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Bottom tab bar: Home, Expenses, Stats, Budgets, Settings. */
export default function TabsLayout() {
  const { colors } = useTheme();

  const icon = (name: IconName, focusedName: IconName) =>
    function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
      return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
    };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerTitle: 'Expense Tracker', tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="expenses"
        options={{ title: 'Expenses', tabBarIcon: icon('list-outline', 'list') }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: 'Stats', tabBarIcon: icon('pie-chart-outline', 'pie-chart') }}
      />
      <Tabs.Screen
        name="budgets"
        options={{ title: 'Budgets', tabBarIcon: icon('wallet-outline', 'wallet') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: icon('settings-outline', 'settings') }}
      />
    </Tabs>
  );
}
