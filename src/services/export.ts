import { listExpenses } from '@/db/expenses';
import type { ExpenseFilters } from '@/types';
import { toCsv } from '@/utils/csv';
import { todayISO } from '@/utils/date';
import { paisaToInputString } from '@/utils/money';

import { shareTextFile } from './shareFile';

/**
 * Exports expenses to a CSV file and opens the Android share sheet
 * (so the user can save it to Drive, send it on WhatsApp, email it, etc.).
 * On web the file is downloaded instead.
 * Returns the number of exported rows.
 */
export async function exportExpensesToCsv(
  currencyCode: string,
  filters: ExpenseFilters = {},
): Promise<number> {
  const expenses = await listExpenses(filters);
  if (expenses.length === 0) return 0;

  const csv = toCsv(
    ['Date', 'Category', `Amount (${currencyCode})`, 'Note', 'Recurring'],
    expenses.map((e) => [
      e.date,
      e.categoryName,
      paisaToInputString(e.amount),
      e.note,
      e.isRecurring ? `Monthly (day ${e.recurringDay})` : '',
    ]),
  );

  await shareTextFile(`expenses-${todayISO()}.csv`, csv, 'text/csv');
  return expenses.length;
}
