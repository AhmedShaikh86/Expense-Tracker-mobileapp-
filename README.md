# Expense Tracker

**Developed by Muhammad Ahmed Shaikh**

📖 **How to use the app:** see the [User Guide (Roman Urdu)](USER_GUIDE.md).

An offline-first personal expense tracker for Android, built with React Native + Expo.
It runs in **Expo Go**, stores everything locally in SQLite, and can optionally sync to the
cloud with **Supabase**. The default currency is **PKR (Rs)**, and you can change it in Settings.

## Features

- **Dashboard**: this month's total, budget used, budget alerts, recent expenses, quick "Add expense"
- **Add / edit expenses**: amount, category picker with icons, date picker, note, "repeat monthly" toggle, full validation
- **Expenses list**: grouped by day with daily totals, search, filters (categories, date range, amount range), delete with confirmation
- **Stats**: donut chart by category and a bar chart of the last 6 months, with a month selector
- **Budgets**: monthly budget per category, progress bars, a warning at 80% and an alert at 100% (also shown right after you save an expense)
- **Categories**: 8 default categories plus your own, each with an icon, color and optional budget
- **Recurring expenses**: rent and bills are added automatically each month when the app opens. A day like 31 falls back to the last day of shorter months
- **CSV export**: export all expenses, or the currently filtered list, and share them through the Android share sheet
- **Settings**: currency, theme (System / Light / Dark), account, clear all data
- **Account and sync (optional)**: Supabase email sign-up, login and logout, with offline-first two-way sync. If no keys are configured, the account features are hidden and the app works fully offline.

## Tech stack

| Area | Library |
| --- | --- |
| Framework | React Native 0.86, Expo SDK 57, TypeScript (strict) |
| Navigation | Expo Router (bottom tabs + stack/modal screens) |
| Local database | `expo-sqlite` with a `PRAGMA user_version` migration system |
| State | Zustand (settings are saved with `expo-sqlite/kv-store`) |
| Forms | react-hook-form + zod |
| Charts | react-native-gifted-charts (on `react-native-svg` + `expo-linear-gradient`) |
| Cloud | Supabase (`@supabase/supabase-js`) |
| Export | `expo-file-system` + `expo-sharing` |

Every dependency is included in Expo Go, so there are no custom native modules.

## Screenshots

> Add your screenshots to `docs/screenshots/` and update the paths below.

| Home | Expenses | Stats | Budgets | Settings |
| --- | --- | --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Expenses](docs/screenshots/expenses.png) | ![Stats](docs/screenshots/stats.png) | ![Budgets](docs/screenshots/budgets.png) | ![Settings](docs/screenshots/settings.png) |

## Project structure

```
src/
  app/                 Screens (Expo Router: every file is a route)
    _layout.tsx        Root stack: startup (DB, migrations, recurring), theme
    (tabs)/            Home, Expenses, Stats, Budgets, Settings
    expense-form.tsx   Add / edit expense (modal)
    categories.tsx     Category list
    category-form.tsx  Add / edit category (modal)
    recurring.tsx      Recurring expenses
    auth.tsx           Sign in / sign up (modal)
  components/          Reusable UI (Button, Input, Card, CategoryIcon, EmptyState, ...)
  constants/           Theme (light/dark colors), default categories, currencies
  db/                  SQLite client, migrations and typed query functions
  hooks/               useTheme, useCurrency, useAsyncData
  services/            Supabase client, sync, recurring expenses, CSV export
  store/               Zustand stores (settings, categories, expenses, auth, sync)
  types/               Shared TypeScript types
  utils/               Money (paisa), dates, CSV, ids
supabase/schema.sql    Cloud tables + row level security
```

**How money is stored:** amounts are stored as integer **paisa** (Rs 1,250.50 is stored as `125050`).
Nothing is stored as floating point, so there are no rounding errors.

## Setup and running on your phone

Requirements: Node.js 20+ and the **Expo Go** app on your Android phone (from the Play Store).

```bash
cd expense-tracker
npm install
npx expo start
```

Scan the QR code with Expo Go. Your phone and computer must be on the same Wi-Fi network.
If they can't connect, try `npx expo start --tunnel`.

### Test on your PC (in the browser)

```bash
npx expo start --web
```

This opens the app in Chrome or Edge. When you save a code file, the page updates by itself.
On the very first load the page reloads once to turn on the in-browser database.
Press **F12 → Toggle device toolbar** (Ctrl+Shift+M) to see it at phone size.
Keep the app open in only one browser tab. Browser data is separate from the data on your phone.

Useful commands:

```bash
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run doctor       # expo-doctor
```

## Supabase setup (optional cloud sync)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the `categories` and `expenses` tables with Row Level Security, so each user can only see their own rows.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Copy `.env.example` to `.env` and fill in both values:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. Restart the dev server with `npx expo start -c` so it picks up the new values.
   An **Account & sync** section then appears in Settings.
6. *(Optional)* In **Authentication → Providers → Email**, you can turn off "Confirm email" for faster testing.

**How sync works:** every change is written to SQLite first, so the app never waits for the network.
Changed rows are uploaded shortly after each edit, and also on login, on app start and when you tap "Sync now".
Downloads fetch only rows the server received since the last sync. When the same row was edited on two
devices, the most recent edit wins. Deletions are synced as "soft deletes".

## Pushing code changes to installed phones (EAS Update)

The app has over-the-air updates. Once a phone has an APK built after this was set up, most code changes
reach it without a new APK:

```bash
npm run update
```

This publishes the current code to the `preview` channel. The next time the app is opened, it downloads the
update and restarts itself, usually within a few seconds. Settings → About then shows "Updated <date>".

When a new APK **is** still needed: after adding a package with native code (`npx expo install ...`), or
changing the app name, icon, splash, package name or plugins in `app.json`. The runtime version uses the
`fingerprint` policy, so an update is never sent to an APK it isn't compatible with. Build a new APK in that case.

## Building an APK / AAB (EAS Build)

```bash
npm install -g eas-cli        # or use npx eas-cli@latest
eas login
eas init                      # links the project to your Expo account (first time only)
```

Environment variables: `.env` is git-ignored, so EAS cloud builds won't see it. If you use Supabase, add the keys
to EAS once:

```bash
eas env:set --name SUPABASE_URL --value https://xxxx.supabase.co --environment preview --visibility plaintext
eas env:set --name SUPABASE_ANON_KEY --value your-anon-key --environment preview --visibility plaintext
# repeat both lines with --environment production for Play Store builds
```

**APK** (install directly on your phone):

```bash
npm run build:apk             # = eas build -p android --profile preview
```

When the build finishes, open the link or QR code on your phone to download and install the APK.

**AAB** (for the Google Play Store):

```bash
npm run build:aab             # = eas build -p android --profile production
```

## Publishing to Google Play

1. Create a [Google Play Console](https://play.google.com/console) developer account (one-time fee).
2. Create the app, then fill in the store listing, content rating, data safety form and privacy policy.
3. Upload the `.aab` from the production build to the **Internal testing** track, or run `eas submit -p android`
   after setting up a Google service account key.
4. Promote the release to **Production** when you're ready.

The Android package name is `com.ahmedshaikh.expensetracker`. `versionCode` is incremented automatically by EAS
(`appVersionSource: remote`).

## Changing the database schema later

Add a new entry to the `MIGRATIONS` array in [`src/db/migrations.ts`](src/db/migrations.ts) with the next version
number. Existing users are upgraded automatically on the next app start. Never edit a migration that has
already shipped.

## App icon and splash

`assets/images/icon.png`, `android-icon-*.png` and `splash-icon.png` are placeholders.
Replace them with your own artwork, keeping the same file names and sizes.
