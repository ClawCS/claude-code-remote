const DAY_MS = 86_400_000;

/** Strict ISO date-only parsing. All subsequent arithmetic stays in UTC days. */
export function parseRentalDate(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp / DAY_MS
    : null;
}

function easterDay(year: number): number {
  // Gregorian computus, matching the market opening-hours calendar.
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), date = ((h + l - 7 * m + 114) % 31) + 1;
  const result = new Date(0);
  result.setUTCFullYear(year, month - 1, date);
  return result.getTime() / DAY_MS;
}

function holidaysForYear(year: number): Set<number> {
  const holidays = new Set<number>();
  for (const [month, day] of [[1, 1], [5, 1], [10, 3], [11, 1], [12, 25], [12, 26]]) {
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    holidays.add(date.getTime() / DAY_MS);
  }
  const easter = easterDay(year);
  for (const offset of [-2, 1, 39, 50, 60]) holidays.add(easter + offset);
  return holidays;
}

/** Inclusive Monday–Saturday, excluding all statutory NRW public holidays. */
export function countRentalWorkdays(startDate: string, endDate: string): number {
  const start = parseRentalDate(startDate), end = parseRentalDate(endDate);
  if (start === null || end === null || end < start) return 0;
  const holidays = new Map<number, Set<number>>();
  let workdays = 0;
  for (let day = start; day <= end; day++) {
    const date = new Date(day * DAY_MS);
    const year = date.getUTCFullYear();
    if (!holidays.has(year)) holidays.set(year, holidaysForYear(year));
    if (date.getUTCDay() !== 0 && !holidays.get(year)!.has(day)) workdays++;
  }
  return workdays;
}
