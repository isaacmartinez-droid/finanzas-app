import {
  BASE_CURRENCY,
  add,
  assertCurrency,
  isNegative,
  maximum,
  minimum,
  subtract,
  toBase,
  zero,
  type Money,
} from "./money";
import type {
  IncomeReceipt,
  LedgerAccount,
  LedgerTransaction,
  Obligation,
  PlannedFinancialEvent,
  Reservation,
  SavingRule,
} from "./types";

export class FinancialEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialEngineError";
  }
}

export interface ReconciledAccount {
  accountId: string;
  balance: Money;
  balanceBase: Money;
  drift?: { native?: Money; base?: Money };
}

/** Rejects malformed accounting facts before they can affect a balance. */
export function validateLedgerTransaction(transaction: LedgerTransaction): void {
  if (transaction.entries.length < 2) {
    throw new FinancialEngineError("A ledger transaction needs at least two entries");
  }
  for (const entry of transaction.entries) {
    if (entry.amountBase.currency !== BASE_CURRENCY) {
      throw new FinancialEngineError("Every ledger entry must have an NIO base amount");
    }
    if (entry.amount.currency === BASE_CURRENCY && entry.amount.minor !== entry.amountBase.minor) {
      throw new FinancialEngineError("NIO ledger entries must preserve their base amount");
    }
    if (entry.amount.currency !== BASE_CURRENCY) {
      if (!entry.exchangeRateToBase || entry.exchangeRateToBase <= 0n) {
        throw new FinancialEngineError("Foreign-currency ledger entries require a positive exchange rate");
      }
      if (toBase(entry.amount, entry.exchangeRateToBase).minor !== entry.amountBase.minor) {
        throw new FinancialEngineError("Ledger entry base amount does not match its exchange rate");
      }
    }
  }
  const totalBase = transaction.entries.reduce((total, entry) => total + entry.amountBase.minor, 0n);
  if (totalBase !== 0n) {
    throw new FinancialEngineError("A ledger transaction must balance in the base currency");
  }
}

/**
 * Computes balances from opening balances plus posted ledger facts. Caches are
 * compared but never used as inputs, which makes drift detectable.
 */
export function reconcileAccounts(accounts: LedgerAccount[], transactions: LedgerTransaction[]): ReconciledAccount[] {
  const entriesByAccount = new Map<string, { amount: Money; amountBase: Money }[]>();
  for (const transaction of transactions) {
    validateLedgerTransaction(transaction);
    if (transaction.status !== "posted") continue;
    for (const entry of transaction.entries) {
      const entries = entriesByAccount.get(entry.accountId) ?? [];
      entries.push(entry);
      entriesByAccount.set(entry.accountId, entries);
    }
  }

  return accounts.map((account) => {
    if (account.openingBalance.currency !== account.currency || account.openingBalanceBase.currency !== BASE_CURRENCY) {
      throw new FinancialEngineError(`Invalid opening balance for account ${account.id}`);
    }
    const entries = entriesByAccount.get(account.id) ?? [];
    if (entries.some((entry) => entry.amount.currency !== account.currency)) {
      throw new FinancialEngineError(`Entry currency does not match account ${account.id}`);
    }
    const balance = add(account.openingBalance, ...entries.map((entry) => entry.amount));
    const balanceBase = add(account.openingBalanceBase, ...entries.map((entry) => entry.amountBase));
    const nativeDrift = account.currentBalanceCache ? subtract(account.currentBalanceCache, balance) : undefined;
    const baseDrift = account.currentBalanceCacheBase ? subtract(account.currentBalanceCacheBase, balanceBase) : undefined;

    return {
      accountId: account.id,
      balance,
      balanceBase,
      drift: nativeDrift || baseDrift ? { native: nativeDrift, base: baseDrift } : undefined,
    };
  });
}

export interface FinancialPositionInput {
  accounts: LedgerAccount[];
  transactions: LedgerTransaction[];
  reservations: Reservation[];
  obligations: Obligation[];
  operatingCushion: Money;
}

export interface FinancialPosition {
  accounts: ReconciledAccount[];
  operatingBalance: Money;
  protectedCurrentFunds: Money;
  freeBeforeCushion: Money;
  freeMoney: Money;
  spendableToday: Money;
}

/** The canonical current-state calculation. It intentionally permits negative free money. */
export function calculateFinancialPosition(input: FinancialPositionInput): FinancialPosition {
  if (input.operatingCushion.currency !== BASE_CURRENCY) {
    throw new FinancialEngineError("Operating cushion must use the base currency");
  }
  const accounts = reconcileAccounts(input.accounts, input.transactions);
  const accountById = new Map(input.accounts.map((account) => [account.id, account]));
  const operatingBalance = sumBase(
    accounts.filter((account) => accountById.get(account.accountId)?.kind === "operational").map((account) => account.balanceBase),
  );
  const reservations = sumBase(input.reservations.filter((item) => item.status === "active").map((item) => item.amount));
  const obligations = sumBase(input.obligations.filter((item) => item.fundingStatus === "unfunded").map((item) => item.amount));
  const protectedCurrentFunds = add(reservations, obligations);
  const freeBeforeCushion = subtract(operatingBalance, protectedCurrentFunds);
  const freeMoney = subtract(freeBeforeCushion, input.operatingCushion);
  const spendableToday = maximum(zero(BASE_CURRENCY), minimum(freeMoney, operatingBalance));

  return { accounts, operatingBalance, protectedCurrentFunds, freeBeforeCushion, freeMoney, spendableToday };
}

export interface IncomeAllocation {
  grossIncome: Money;
  compensation: Money;
  cashReceived: Money;
  savingTarget: Money;
  savingReserved: Money;
  savingShortfall: Money;
  earmarkedReserved?: Money;
}

/** Applies the C$1,000 rule only to personal cash receipts, never to earmarked funds. */
export function allocateIncome(receipt: IncomeReceipt, rule: SavingRule): IncomeAllocation {
  assertBase(receipt.grossAmount, "Gross income");
  assertBase(receipt.compensationAmount, "Compensation");
  assertBase(rule.amount, "Saving rule");
  assertCurrency(receipt.grossAmount, receipt.compensationAmount);
  if (isNegative(receipt.grossAmount) || isNegative(receipt.compensationAmount)) {
    throw new FinancialEngineError("Income and compensation must be positive values");
  }
  const cashReceived = subtract(receipt.grossAmount, receipt.compensationAmount);
  if (isNegative(cashReceived)) throw new FinancialEngineError("Compensation cannot exceed gross income");

  if (receipt.fundingPurpose === "PERSONAL_INCOME") {
    const savingReserved = minimum(rule.amount, cashReceived);
    return {
      grossIncome: receipt.grossAmount,
      compensation: receipt.compensationAmount,
      cashReceived,
      savingTarget: rule.amount,
      savingReserved,
      savingShortfall: subtract(rule.amount, savingReserved),
    };
  }

  if (receipt.fundingPurpose === "EARMARKED") {
    if (!receipt.earmarkPurpose) throw new FinancialEngineError("Earmarked income needs a purpose");
    return {
      grossIncome: receipt.grossAmount,
      compensation: receipt.compensationAmount,
      cashReceived,
      savingTarget: zero(BASE_CURRENCY),
      savingReserved: zero(BASE_CURRENCY),
      savingShortfall: zero(BASE_CURRENCY),
      earmarkedReserved: cashReceived,
    };
  }

  return {
    grossIncome: receipt.grossAmount,
    compensation: receipt.compensationAmount,
    cashReceived,
    savingTarget: zero(BASE_CURRENCY),
    savingReserved: zero(BASE_CURRENCY),
    savingShortfall: zero(BASE_CURRENCY),
  };
}

export interface ProjectionInput {
  currentFreeMoney: Money;
  today: string;
  untilExclusive: string;
  events: PlannedFinancialEvent[];
}

/** Adds only future active planned events. Ledger transactions are deliberately absent. */
export function projectFreeMoney(input: ProjectionInput): Money {
  assertBase(input.currentFreeMoney, "Current free money");
  return input.events
    .filter((event) => (event.status === "expected" || event.status === "scheduled") && event.active !== false)
    .filter((event) => event.occursOn > input.today && event.occursOn < input.untilExclusive)
    .sort((left, right) => left.occursOn.localeCompare(right.occursOn))
    .reduce((total, event) => {
      assertBase(event.amount, "Planned event");
      return event.kind === "income" ? add(total, event.amount) : subtract(total, event.amount);
    }, input.currentFreeMoney);
}

function sumBase(values: Money[]): Money {
  for (const value of values) assertBase(value, "Protected amount");
  return values.length ? add(...values) : zero(BASE_CURRENCY);
}

function assertBase(value: Money, label: string): void {
  if (value.currency !== BASE_CURRENCY) throw new FinancialEngineError(`${label} must use the base currency`);
}
