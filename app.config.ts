import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic config: takes everything from app.json and adds the Supabase keys
 * from .env (Expo CLI loads .env automatically). The app reads them via
 * `Constants.expoConfig.extra`. If they are missing, cloud features are hidden
 * and the app works fully offline.
 *
 * Both SUPABASE_URL and EXPO_PUBLIC_SUPABASE_URL (same for the key) are accepted.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
});
