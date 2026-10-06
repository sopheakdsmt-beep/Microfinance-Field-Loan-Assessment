export type Currency = "KHR" | "USD";

/** Reference desk rate used until the officer records the rate on the application. */
export const DEFAULT_KHR_PER_USD = 4100;

export function scaleOf(currency: Currency): number {
  return currency === "USD" ? 100 : 1;
}

/** Integer minor units: US cents, or whole riel. */
export function toMinor(amount: number, currency: Currency): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * scaleOf(currency));
}

export function fromMinor(minor: number, currency: Currency): number {
  return minor / scaleOf(currency);
}

/**
 * Field rounding. US dollars round to the cent. Riel payments round to the
 * nearest 100, which is how tellers count cash, except tiny amounts that
 * would collapse to zero.
 */
export function roundMinor(minor: number, currency: Currency): number {
  if (currency === "USD") return Math.round(minor);
  const step = Math.abs(minor) >= 1000 ? 100 : 1;
  return Math.round(minor / step) * step;
}

export function roundMoney(amount: number, currency: Currency): number {
  return fromMinor(roundMinor(toMinor(amount, currency), currency), currency);
}

export function formatMinor(minor: number, currency: Currency): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minor));
  if (currency === "USD") {
    const dollars = Math.floor(abs / 100);
    const cents = abs % 100;
    return `${sign}$${dollars.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
  }
  return `${sign}៛${abs.toLocaleString("en-US")}`;
}

export function formatMoney(amount: number, currency: Currency): string {
  return formatMinor(toMinor(amount, currency), currency);
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  khrPerUsd: number,
): number {
  if (from === to) return amount;
  if (!(khrPerUsd > 0) || !Number.isFinite(amount)) return 0;
  const major = from === "USD" ? amount * khrPerUsd : amount / khrPerUsd;
  return roundMoney(major, to);
}
