import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { APP_NAME, DEVELOPER_NAME } from '@/constants/app';
import { CURRENCIES } from '@/constants/currencies';
import { Radius, Spacing } from '@/constants/theme';
import { clearAllLocalData } from '@/db/expenses';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { exportExpensesToCsv } from '@/services/export';
import { isSupabaseConfigured } from '@/services/supabase';
import { deleteAllCloudData, syncNow } from '@/services/sync';
import { useAuthStore } from '@/store/auth';
import { notifyDataChanged } from '@/store/data';
import { useSettingsStore } from '@/store/settings';
import { useSyncStore } from '@/store/sync';
import type { ThemeMode } from '@/types';
import { Alert } from '@/utils/alert';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const { isSyncing, lastSyncedAt, error: syncError } = useSyncStore();

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const count = await exportExpensesToCsv(currency.code);
      if (count === 0) Alert.alert('Nothing to export', 'Add some expenses first.');
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const onSync = () => {
    syncNow().catch((e: unknown) =>
      Alert.alert('Sync failed', e instanceof Error ? e.message : 'Unknown error'),
    );
  };

  const onSignOut = () => {
    Alert.alert('Log out?', 'Your data stays on this phone. Pending changes are uploaded first.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          signOut().catch((e: unknown) =>
            Alert.alert('Logout failed', e instanceof Error ? e.message : 'Unknown error'),
          );
        },
      },
    ]);
  };

  const onClearAll = () => {
    const cloudNote = session ? '\n\nYour cloud copy will be deleted too.' : '';
    Alert.alert(
      'Clear all data?',
      `This permanently deletes all expenses, custom categories and budgets.${cloudNote}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              if (session) await deleteAllCloudData();
              await clearAllLocalData();
              notifyDataChanged();
              Alert.alert('Done', 'All data has been cleared.');
            } catch (e) {
              Alert.alert('Could not clear data', e instanceof Error ? e.message : 'Unknown error');
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      {/* Appearance */}
      <Card style={styles.gap}>
        <AppText variant="heading">Appearance</AppText>
        <SegmentedControl options={THEME_OPTIONS} value={themeMode} onChange={setThemeMode} />
        <ListItem
          icon="cash-outline"
          title="Currency"
          subtitle={`${currency.name} (${currency.symbol})`}
          onPress={() => setCurrencyOpen(true)}
        />
      </Card>

      {/* Data */}
      <Card>
        <AppText variant="heading">Data</AppText>
        <ListItem
          icon="pricetags-outline"
          title="Categories"
          subtitle="Add, edit and delete categories"
          onPress={() => router.push('/categories')}
        />
        <ListItem
          icon="repeat-outline"
          title="Recurring expenses"
          subtitle="Rent, bills and other monthly costs"
          onPress={() => router.push('/recurring')}
        />
        <ListItem
          icon="download-outline"
          title="Export to CSV"
          subtitle="Share all expenses as a spreadsheet"
          onPress={exporting ? undefined : onExport}
          right={exporting ? <ActivityIndicator color={colors.primary} /> : undefined}
        />
      </Card>

      {/* Account — only shown when Supabase keys are configured */}
      {isSupabaseConfigured && (
        <Card style={styles.gap}>
          <AppText variant="heading">Account & sync</AppText>
          {session ? (
            <>
              <View style={styles.accountRow}>
                <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
                <View style={styles.flex}>
                  <AppText bold numberOfLines={1}>
                    {session.user.email}
                  </AppText>
                  <AppText variant="caption" muted>
                    {isSyncing
                      ? 'Syncing…'
                      : lastSyncedAt
                        ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                        : 'Not synced yet'}
                  </AppText>
                </View>
              </View>
              {syncError && (
                <AppText variant="caption" color={colors.danger}>
                  Sync error: {syncError}
                </AppText>
              )}
              <View style={styles.row}>
                <Button
                  title="Sync now"
                  icon="sync"
                  variant="secondary"
                  onPress={onSync}
                  loading={isSyncing}
                  style={styles.flex}
                />
                <Button title="Log out" variant="secondary" onPress={onSignOut} style={styles.flex} />
              </View>
            </>
          ) : (
            <>
              <AppText muted>Sign in to back up your expenses and sync them across devices.</AppText>
              <Button
                title="Sign in or create account"
                icon="log-in-outline"
                onPress={() => router.push('/auth')}
              />
            </>
          )}
        </Card>
      )}

      {/* Danger zone */}
      <Card>
        <ListItem
          icon="trash-outline"
          title="Clear all data"
          subtitle="Delete every expense and custom category"
          destructive
          onPress={clearing ? undefined : onClearAll}
          right={clearing ? <ActivityIndicator color={colors.danger} /> : undefined}
        />
      </Card>

      {/* About */}
      <Card style={styles.about}>
        <Ionicons name="wallet" size={36} color={colors.primary} />
        <AppText variant="heading">{APP_NAME}</AppText>
        <AppText variant="caption" muted>
          Version {Constants.expoConfig?.version ?? '1.0.0'}
          {isSupabaseConfigured ? '' : ' · Offline mode'}
        </AppText>
        {/* Shows when the last over-the-air update was published (installed APK only). */}
        {!Updates.isEmbeddedLaunch && Updates.createdAt && (
          <AppText variant="caption" muted>
            Updated {Updates.createdAt.toLocaleString()}
          </AppText>
        )}
        <AppText variant="label" muted style={styles.madeBy}>
          Developed by
        </AppText>
        <AppText bold color={colors.primary}>
          {DEVELOPER_NAME}
        </AppText>
        <AppText variant="caption" muted>
          © {new Date().getFullYear()} {DEVELOPER_NAME}. All rights reserved.
        </AppText>
      </Card>

      {/* Currency picker */}
      <Modal
        visible={currencyOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <AppText variant="heading" style={styles.sheetTitle}>
              Choose currency
            </AppText>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setCurrency(item.code);
                    setCurrencyOpen(false);
                  }}
                  style={styles.currencyRow}>
                  <AppText bold style={styles.currencySymbol}>
                    {item.symbol}
                  </AppText>
                  <AppText style={styles.flex}>{item.name}</AppText>
                  {item.code === currency.code && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
            <Button title="Close" variant="ghost" onPress={() => setCurrencyOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  about: { alignItems: 'center', gap: 4 },
  madeBy: { marginTop: Spacing.sm },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sheetTitle: { marginBottom: Spacing.sm },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  currencySymbol: { width: 44 },
});
