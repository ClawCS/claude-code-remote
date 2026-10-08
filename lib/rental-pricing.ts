import { getRentalItem } from "@/data/rentals";
import { countRentalWorkdays, parseRentalDate } from "@/lib/rental-calendar";

export type RentalSelection = {
  id: number;
  quantity: number;
  startDate: string;
  endDate: string;
};

export type RentalQuoteLine = RentalSelection & {
  name: string;
  workdays: number;
  periods: number;
  /** Catalog gross price per item and started three-workday block. */
  unitPriceCents: number | null;
  lineTotalCents: number | null;
};

export type RentalQuote = {
  lines: RentalQuoteLine[];
  totalCents: number | null;
  knownSubtotalCents: number;
  allPriced: boolean;
  currency: "EUR";
  pricingVersion: string;
};

const PRICING_VERSION = "nrw-3-workdays-v2-prices-2026-10-08-stock-2026-03-06";

function berlinToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function assertInventory(lines: readonly RentalQuoteLine[]): void {
  for (let index = 0; index < lines.length; index++) {
    const first = lines[index];
    for (const second of lines.slice(index + 1)) {
      const furnitureConflict = (first.id === 20007 && [20005, 20006].includes(second.id)) ||
        (second.id === 20007 && [20005, 20006].includes(first.id));
      if (furnitureConflict && first.startDate <= second.endDate && second.startDate <= first.endDate) {
        throw new Error("Bierzeltgarnituren und einzelne Tische oder Bänke können im selben Zeitraum nicht kombiniert werden.");
      }
    }
  }

  for (const id of new Set(lines.map(line => line.id))) {
    const item = getRentalItem(id)!;
    const events = new Map<number, number>();
    for (const line of lines.filter(line => line.id === id)) {
      const start = parseRentalDate(line.startDate)!;
      // Inclusive pickup/return: stock is released only on the following day.
      const release = parseRentalDate(line.endDate)! + 1;
      events.set(start, (events.get(start) ?? 0) + line.quantity);
      events.set(release, (events.get(release) ?? 0) - line.quantity);
    }
    let occupied = 0;
    for (const [, change] of [...events].sort(([first], [second]) => first - second)) {
      occupied += change;
      if (occupied > item.physicalStock) {
        throw new Error(`Der physische Bestand für ${item.name} (${item.physicalStock}) wird im gewünschten Zeitraum überschritten.`);
      }
    }
  }
}

/** Canonical quote, not a live availability promise or an accepted contract. */
export function quoteRentals(
  selection: readonly RentalSelection[],
  options: { today?: string; requireFuture?: boolean } = {},
): RentalQuote {
  if (!Array.isArray(selection) || selection.length === 0) {
    throw new Error("Bitte mindestens einen bekannten Leihartikel auswählen.");
  }
  if (selection.length > 50) throw new Error("Bitte höchstens 50 Leihartikel-Zeilen auswählen.");
  const today = options.today ?? (options.requireFuture ? berlinToday() : undefined);
  if (today !== undefined && parseRentalDate(today) === null) throw new Error("Bitte ein gültiges heutiges Datum verwenden.");

  const aggregate = new Map<string, RentalSelection>();
  for (const entry of selection) {
    const item = entry && Number.isSafeInteger(entry.id) ? getRentalItem(entry.id) : undefined;
    if (!item) throw new Error("Bitte einen bekannten Leihartikel auswählen.");
    if (!Number.isSafeInteger(entry.quantity) || entry.quantity < 1) {
      throw new Error(`Bitte eine gültige ganze Menge für ${item.name} auswählen.`);
    }
    const start = parseRentalDate(entry.startDate), end = parseRentalDate(entry.endDate);
    if (start === null || end === null || end < start) throw new Error("Bitte einen gültigen Leihzeitraum auswählen.");
    if (end - start + 1 > 366) throw new Error("Der Leihzeitraum darf höchstens 366 Kalendertage umfassen.");
    if (options.requireFuture && entry.startDate < today!) throw new Error("Der Abholtermin darf nicht in der Vergangenheit liegen.");

    const key = `${entry.id}:${entry.startDate}:${entry.endDate}`;
    const quantity = (aggregate.get(key)?.quantity ?? 0) + entry.quantity;
    if (!Number.isSafeInteger(quantity) || quantity > item.physicalStock) {
      throw new Error(`Der physische Bestand für ${item.name} (${item.physicalStock}) wird im gewünschten Zeitraum überschritten.`);
    }
    aggregate.set(key, { id: item.id, quantity, startDate: entry.startDate, endDate: entry.endDate });
  }

  const lines: RentalQuoteLine[] = [...aggregate.values()].map(line => {
    const item = getRentalItem(line.id)!;
    const workdays = countRentalWorkdays(line.startDate, line.endDate);
    if (workdays === 0) throw new Error("Der Leihzeitraum muss mindestens einen Werktag (Mo–Sa, ohne NRW-Feiertage) enthalten.");
    const periods = Math.ceil(workdays / 3);
    const unitPriceCents = item.price === null ? null : Math.round(item.price * 100);
    return { ...line, name: item.name, workdays, periods, unitPriceCents,
      lineTotalCents: unitPriceCents === null ? null : unitPriceCents * periods * line.quantity };
  });
  assertInventory(lines);
  const allPriced = lines.every(line => line.lineTotalCents !== null);
  const knownSubtotalCents = lines.reduce((sum, line) => sum + (line.lineTotalCents ?? 0), 0);
  return { lines, totalCents: allPriced ? knownSubtotalCents : null,
    knownSubtotalCents, allPriced, currency: "EUR", pricingVersion: PRICING_VERSION };
}
