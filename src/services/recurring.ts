import { createExpense, getRecurringExpenses, hasGeneratedEntry } from '@/db/expenses';
import { daysInMonth, monthRange, parseISODate, toISODate } from '@/utils/date';

/**
 * Creates the monthly entries for recurring expenses (rent, bills...).
 *
 * A recurring expense acts as a template. For every month AFTER the
 * template's own month, up to and including the current month, we create one
 * normal expense on the template's `recurringDay` — once that day has arrived.
 * If the month is shorter (e.g. day 31 in February) we use its last day.
 *
 * Runs every time the app opens. Returns how many entries were created.
 */
export async function processRecurringExpenses(today: Date = new Date()): Promise<number> {
  const templates = await getRecurringExpenses();
  const todayISO = toISODate(today);
  let created = 0;

  for (const template of templates) {
    if (!template.recurringDay) continue;

    const start = parseISODate(template.date);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Begin with the first day of the month after the template's month.
    // (new Date handles the year rollover, e.g. December -> January.)
    let cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);

    while (cursor <= currentMonth) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const day = Math.min(template.recurringDay, daysInMonth(year, month));
      const dueDate = toISODate(new Date(year, month, day));
      if (dueDate > todayISO) break;

      const range = monthRange(cursor);
      const exists = await hasGeneratedEntry(template.id, range.start, range.end);
      if (!exists) {
        await createExpense(
          {
            amount: template.amount,
            categoryId: template.categoryId,
            date: dueDate,
            note: template.note,
            isRecurring: false,
            recurringDay: null,
          },
          template.id,
        );
        created++;
      }
      cursor = new Date(year, month + 1, 1);
    }
  }
  return created;
}
