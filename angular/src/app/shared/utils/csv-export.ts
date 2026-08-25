/**
 * Builds a CSV string and triggers a browser download for it.
 * Pure client-side — no backend endpoint needed.
 */

/** Escapes a single CSV field per RFC 4180 (quotes fields containing commas, quotes, or newlines). */
function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Builds a CSV string from column headers and row data. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map(row => row.map(escapeCsvField).join(','));
  // Leading BOM so Excel opens UTF-8 CSVs with correct encoding instead of mojibake.
  return '\uFEFF' + lines.join('\r\n');
}

/** Triggers a browser download of the given CSV content as a file. */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
