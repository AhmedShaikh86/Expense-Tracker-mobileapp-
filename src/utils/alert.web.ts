import type { AlertButton } from 'react-native';

/**
 * Web version of Alert (see alert.ts). Uses the browser's built-in dialogs:
 * - no buttons / one button  -> window.alert
 * - Cancel + an action button -> window.confirm, then runs the chosen button
 */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]): void {
    const text = message ? `${title}\n\n${message}` : title;
    const cancel = buttons?.find((b) => b.style === 'cancel');
    const action = buttons?.find((b) => b.style !== 'cancel');

    if (!buttons || buttons.length <= 1 || !action) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    if (window.confirm(text)) action.onPress?.();
    else cancel?.onPress?.();
  },
};
