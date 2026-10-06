function cell(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: (string | number)[][]): string {
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}`;
}
