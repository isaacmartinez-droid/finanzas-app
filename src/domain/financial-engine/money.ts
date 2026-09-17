export type Currency = "NIO" | "USD";

/** Monetary values are stored as signed minor units, never floating point. */
export interface Money {
  currency: Currency;
  minor: bigint;
}

export const BASE_CURRENCY: Currency = "NIO";
export const EXCHANGE_RATE_SCALE = 100_000_000n;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/** Parses a decimal monetary literal such as `"6409.25"` exactly. */
export function money(currency: Currency, value: string): Money {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new MoneyError(`Invalid monetary value: ${value}`);

  const [, sign, integer, fraction = ""] = match;
  const minor = BigInt(integer) * 100n + BigInt(fraction.padEnd(2, "0"));
  return { currency, minor: sign === "-" ? -minor : minor };
}

/** Serializes exact minor units for database or HTTP boundaries without using floats. */
export function moneyToDecimal(value: Money): string {
  const sign = value.minor < 0n ? "-" : "";
  const absolute = value.minor < 0n ? -value.minor : value.minor;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function zero(currency: Currency): Money {
  return { currency, minor: 0n };
}

export function add(...values: Money[]): Money {
  if (values.length === 0) throw new MoneyError("Cannot add an empty list of money values");
  const currency = values[0].currency;
  if (values.some((value) => value.currency !== currency)) {
    throw new MoneyError("Cannot add different currencies");
  }
  return { currency, minor: values.reduce((total, value) => total + value.minor, 0n) };
}

export function subtract(left: Money, right: Money): Money {
  assertCurrency(left, right);
  return { currency: left.currency, minor: left.minor - right.minor };
}

export function minimum(left: Money, right: Money): Money {
  assertCurrency(left, right);
  return left.minor <= right.minor ? left : right;
}

export function maximum(left: Money, right: Money): Money {
  assertCurrency(left, right);
  return left.minor >= right.minor ? left : right;
}

export function isNegative(value: Money): boolean {
  return value.minor < 0n;
}

export function assertCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) {
    throw new MoneyError(`Currency mismatch: ${left.currency} and ${right.currency}`);
  }
}

/** Parses a rate with up to eight decimals, e.g. `"36.6243"` NIO per USD. */
export function exchangeRate(value: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,8}))?$/.exec(value);
  if (!match || BigInt(match[1]) === 0n) throw new MoneyError(`Invalid exchange rate: ${value}`);
  return BigInt(match[1]) * EXCHANGE_RATE_SCALE + BigInt((match[2] ?? "").padEnd(8, "0"));
}

/** Converts an amount into NIO, rounding only the resulting monetary amount. */
export function toBase(value: Money, rateToBase: bigint): Money {
  if (value.currency === BASE_CURRENCY) return value;
  return { currency: BASE_CURRENCY, minor: divideAndRound(value.minor * rateToBase, EXCHANGE_RATE_SCALE) };
}

function divideAndRound(numerator: bigint, denominator: bigint): bigint {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return sign * ((absolute + denominator / 2n) / denominator);
}
