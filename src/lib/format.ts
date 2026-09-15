import type { Currency } from "@/types/finance";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  NIO: "C$",
  USD: "US$",
};

export const CURRENCY_NAME: Record<Currency, string> = {
  NIO: "Córdobas",
  USD: "Dólares",
};

/** Typographic minus — reads as "menos" in screen readers and aligns with tabular digits. */
export const MINUS = "−";

export type Decimals = "auto" | 0 | 2;
export type SignMode = "auto" | "always" | "never";

export interface MoneyFormatOptions {
  /** `auto` shows cents only when the value has them. */
  decimals?: Decimals;
  /** `always` prefixes "+" on positive values. */
  sign?: SignMode;
}

export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function round2(value: number): number {
  return roundTo(value, 2);
}

function resolveDecimals(value: number, decimals: Decimals): 0 | 2 {
  if (decimals !== "auto") return decimals;
  return Number.isInteger(round2(value)) ? 0 : 2;
}

const formatters = new Map<number, Intl.NumberFormat>();
function numberFormatter(decimals: number): Intl.NumberFormat {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(decimals, f);
  }
  return f;
}

export function formatNumber(value: number, decimals: Decimals = "auto"): string {
  const d = resolveDecimals(value, decimals);
  return numberFormatter(d).format(Math.abs(roundTo(value, d)));
}

export function signPrefix(value: number, sign: SignMode, decimals: Decimals = "auto"): string {
  if (sign === "never") return "";
  const rounded = roundTo(value, resolveDecimals(value, decimals));
  if (rounded < 0) return MINUS;
  if (sign === "always" && rounded > 0) return "+";
  return "";
}

/** `C$1,482.21`, `−C$1,240.50`, `+US$175`. */
export function formatMoney(amount: number, currency: Currency = "NIO", options: MoneyFormatOptions = {}): string {
  const { decimals = "auto", sign = "auto" } = options;
  return `${signPrefix(amount, sign, decimals)}${CURRENCY_SYMBOL[currency]}${formatNumber(amount, decimals)}`;
}

/** `C$ ••••••` — labels and dates stay visible, only amounts hide (spec §21). */
export function formatMaskedMoney(amount: number, currency: Currency = "NIO", sign: SignMode = "auto"): string {
  return `${signPrefix(amount, sign)}${CURRENCY_SYMBOL[currency]} ••••••`;
}

/** Parses user input like "1,100.50" → 1100.5. Returns null when empty or invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const [int, ...rest] = cleaned.split(".");
  const normalized = rest.length ? `${int || "0"}.${rest.join("").slice(0, 2)}` : int;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Keeps digits, one dot and up to two decimals while typing; adds thousands separators. */
export function sanitizeAmountInput(input: string): string {
  const cleaned = input.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const firstDot = cleaned.indexOf(".");
  const intRaw = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  const decRaw = firstDot === -1 ? null : cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  const intPart = intRaw.replace(/^0+(?=\d)/, "").slice(0, 12);
  const grouped = (intPart || (decRaw !== null ? "0" : "")).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decRaw === null ? grouped : `${grouped}.${decRaw}`;
}

export function formatAmountInput(value: number): string {
  return numberFormatter(2).format(value);
}

export function convert(amount: number, from: Currency, to: Currency, rate: number): number {
  if (from === to) return amount;
  return from === "USD" ? amount * rate : amount / rate;
}

export function toNio(amount: number, currency: Currency, rate: number): number {
  return convert(amount, currency, "NIO", rate);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
