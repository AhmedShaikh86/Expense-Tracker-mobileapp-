/**
 * Money helpers.
 *
 * We store money as integer paisa (cents). 1,250.50 Rs is stored as 125050.
 * Only convert to a decimal string when showing it on screen.
 */

/**
 * Parses what the user typed (e.g. "1,250.5") into paisa (125050).
 * Returns null if the text is not a valid amount.
 * Works on the string directly so no floating-point math is involved.
 */
export function parseAmountToPaisa(text: string): number | null {
  const cleaned = text.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(paisa) ? paisa : null;
}

/** Converts paisa to a plain editable string, e.g. 125050 -> "1250.50", 5000 -> "50". */
export function paisaToInputString(paisa: number): string {
  const whole = Math.floor(paisa / 100);
  const fraction = paisa % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

/** Adds thousands separators: 1234567 -> "1,234,567". */
function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats paisa for display, e.g. formatMoney(125050, 'Rs') -> "Rs 1,250.50".
 * Whole amounts drop the decimals: "Rs 1,250".
 */
export function formatMoney(paisa: number, symbol: string, options?: { compact?: boolean }): string {
  const negative = paisa < 0;
  const abs = Math.abs(paisa);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;

  let body: string;
  if (options?.compact && whole >= 1000) {
    // Short form for chart labels: 1.2K, 3.4M
    body = whole >= 1_000_000 ? `${(whole / 1_000_000).toFixed(1)}M` : `${(whole / 1000).toFixed(1)}K`;
  } else {
    body = groupThousands(whole) + (fraction ? `.${String(fraction).padStart(2, '0')}` : '');
  }
  return `${negative ? '-' : ''}${symbol} ${body}`;
}

/** Converts paisa to a plain number of rupees (only for charts, never for storage). */
export function paisaToNumber(paisa: number): number {
  return paisa / 100;
}
