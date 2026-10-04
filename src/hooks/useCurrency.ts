import { useCallback } from 'react';

import { getCurrency } from '@/constants/currencies';
import { useSettingsStore } from '@/store/settings';
import { formatMoney } from '@/utils/money';

/** Returns the selected currency and a `format(paisa)` helper bound to it. */
export function useCurrency() {
  const code = useSettingsStore((s) => s.currencyCode);
  const currency = getCurrency(code);
  const format = useCallback(
    (paisa: number, options?: { compact?: boolean }) => formatMoney(paisa, currency.symbol, options),
    [currency.symbol],
  );
  return { currency, format };
}
