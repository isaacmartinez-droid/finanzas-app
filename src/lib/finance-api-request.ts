import { exchangeRate, money, toBase, type Currency, type Money } from "@/domain/financial-engine/money";
import type { AccountKind, LedgerTransaction } from "@/domain/financial-engine/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const currencies = new Set<Currency>(["NIO", "USD"]);
const accountKinds = new Set<AccountKind>(["operational", "savings", "liability", "equity", "external"]);

export class FinanceApiInputError extends Error {}

export interface CreateAccountInput {
  name: string;
  normalizedName: string;
  kind: AccountKind;
  currency: Currency;
  openingBalance: Money;
  openingBalanceBase: Money;
}

export interface RenameAccountInput {
  name: string;
  normalizedName: string;
}

export interface PostLedgerTransactionInput {
  operationId: string;
  transaction: LedgerTransaction;
}

export interface PostMovementInput {
  operationId: string;
  occurredOn: string;
  type: "expense" | "income" | "transfer";
  title: string;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  amount: Money;
  amountBase: Money;
  exchangeRateToBase?: bigint;
}

export function parseCreateAccountInput(input: unknown): CreateAccountInput {
  const body = record(input);
  const name = text(body.name, "name", 120).replace(/\s+/g, " ");
  const kind = accountKind(body.kind);
  const currency = currencyValue(body.currency);
  const openingBalance = parseMoney(currency, body.openingBalance, "openingBalance");
  const openingBalanceBase = parseBaseAmount(openingBalance, body.exchangeRate);
  return { name, normalizedName: name.toLocaleLowerCase(), kind, currency, openingBalance, openingBalanceBase };
}

export function parseRenameAccountInput(input: unknown): RenameAccountInput {
  const body = record(input);
  const name = text(body.name, "name", 120).replace(/\s+/g, " ");
  return { name, normalizedName: name.toLocaleLowerCase() };
}

export function parseAccountId(value: string): string {
  if (!UUID.test(value)) throw new FinanceApiInputError("accountId must be a UUID");
  return value;
}

export function parsePostLedgerTransactionInput(input: unknown): PostLedgerTransactionInput {
  const body = record(input);
  const operationId = uuid(body.operationId, "operationId");
  const entriesValue = body.entries;
  if (!Array.isArray(entriesValue) || entriesValue.length < 2 || entriesValue.length > 20) {
    throw new FinanceApiInputError("entries must contain between 2 and 20 items");
  }

  return {
    operationId,
    transaction: {
      id: crypto.randomUUID(),
      occurredOn: isoDate(body.occurredOn),
      status: "posted",
      entries: entriesValue.map((value) => parseLedgerEntry(value)),
    },
  };
}

export function parsePostMovementInput(input: unknown): PostMovementInput {
  const body = record(input);
  const type = movementType(body.type);
  const currency = currencyValue(body.currency);
  const amount = parseMoney(currency, body.amount, "amount");
  if (amount.minor <= 0n) throw new FinanceApiInputError("amount must be greater than zero");
  const exchangeRateToBase = currency === "USD" ? exchangeRateValue(body.exchangeRate) : undefined;
  if (currency === "NIO" && body.exchangeRate !== undefined) {
    throw new FinanceApiInputError("exchangeRate is only allowed for USD movements");
  }
  const toAccountId = type === "transfer" ? uuid(body.toAccountId, "toAccountId") : undefined;
  if (type === "transfer" && toAccountId === uuid(body.accountId, "accountId")) {
    throw new FinanceApiInputError("A transfer needs two different accounts");
  }
  return {
    operationId: uuid(body.operationId, "operationId"),
    occurredOn: isoDate(body.occurredOn),
    type,
    title: text(body.title, "title", 160).replace(/\s+/g, " "),
    categoryId: text(body.categoryId, "categoryId", 48),
    accountId: uuid(body.accountId, "accountId"),
    toAccountId,
    amount,
    amountBase: toBase(amount, exchangeRateToBase ?? 1n),
    exchangeRateToBase,
  };
}

function parseLedgerEntry(input: unknown) {
  const entry = record(input);
  const currency = currencyValue(entry.currency);
  const amount = parseMoney(currency, entry.amount, "amount");
  if (amount.minor === 0n) throw new FinanceApiInputError("amount must not be zero");

  const amountBase = parseMoney("NIO", entry.amountBase, "amountBase");
  if (amountBase.minor === 0n) throw new FinanceApiInputError("amountBase must not be zero");
  if (currency === "NIO" && entry.exchangeRate !== undefined) {
    throw new FinanceApiInputError("exchangeRate is only allowed for USD entries");
  }
  const exchangeRateToBase = currency === "USD" ? exchangeRateValue(entry.exchangeRate) : undefined;

  return {
    accountId: uuid(entry.accountId, "accountId"),
    amount,
    amountBase,
    exchangeRateToBase,
  };
}

function parseBaseAmount(value: Money, rawRate: unknown): Money {
  if (value.currency === "NIO") {
    if (rawRate !== undefined) throw new FinanceApiInputError("exchangeRate is only allowed for USD accounts");
    return value;
  }
  return toBase(value, exchangeRateValue(rawRate));
}

function parseMoney(currency: Currency, value: unknown, field: string): Money {
  try {
    return money(currency, text(value, field, 32));
  } catch {
    throw new FinanceApiInputError(`${field} must be a decimal amount with at most two decimals`);
  }
}

function exchangeRateValue(value: unknown): bigint {
  try {
    return exchangeRate(text(value, "exchangeRate", 32));
  } catch {
    throw new FinanceApiInputError("exchangeRate must be a positive decimal with at most eight decimals");
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FinanceApiInputError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new FinanceApiInputError(`${field} must be a string`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) throw new FinanceApiInputError(`${field} has an invalid length`);
  return trimmed;
}

function currencyValue(value: unknown): Currency {
  if (typeof value !== "string" || !currencies.has(value as Currency)) {
    throw new FinanceApiInputError("currency must be NIO or USD");
  }
  return value as Currency;
}

function accountKind(value: unknown): AccountKind {
  if (typeof value !== "string" || !accountKinds.has(value as AccountKind)) {
    throw new FinanceApiInputError("kind is invalid");
  }
  return value as AccountKind;
}

function movementType(value: unknown): PostMovementInput["type"] {
  if (value === "expense" || value === "income" || value === "transfer") return value;
  throw new FinanceApiInputError("type is invalid");
}

function uuid(value: unknown, field: string): string {
  const result = text(value, field, 36);
  if (!UUID.test(result)) throw new FinanceApiInputError(`${field} must be a UUID`);
  return result;
}

function isoDate(value: unknown): string {
  const result = text(value, "occurredOn", 10);
  const match = ISO_DATE.exec(result);
  if (!match) throw new FinanceApiInputError("occurredOn must use YYYY-MM-DD");

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new FinanceApiInputError("occurredOn must be a real calendar date");
  }
  return result;
}
