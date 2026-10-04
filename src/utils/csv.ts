/**
 * Tiny CSV builder. Wraps values in quotes when needed and escapes quotes,
 * so notes containing commas or line breaks don't break the file.
 */

function escapeCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  // \r\n line endings open correctly in Excel and Google Sheets.
  return lines.join('\r\n');
}
