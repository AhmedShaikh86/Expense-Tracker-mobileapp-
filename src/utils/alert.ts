/**
 * Cross-platform Alert.
 *
 * On Android/iOS this is React Native's own Alert. On web (where RN's Alert
 * does nothing) the `alert.web.ts` file is used instead, which falls back to
 * the browser's alert/confirm dialogs. Import Alert from here, not from
 * 'react-native', so popups work everywhere.
 */
export { Alert } from 'react-native';
