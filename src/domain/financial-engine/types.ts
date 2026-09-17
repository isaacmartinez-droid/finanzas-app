import type { Currency, Money } from "./money";

export type ISODate = string;
export type AccountKind = "operational" | "savings" | "liability" | "equity" | "external";

export interface LedgerAccount {
  id: string;
  kind: AccountKind;
  currency: Currency;
  /** The reconciliable starting point for this account. */
  openingBalance: Money;
  openingBalanceBase: Money;
  /** Optional denormalized cache; it never replaces ledger-derived balance. */
  currentBalanceCache?: Money;
  currentBalanceCacheBase?: Money;
}

export interface LedgerEntry {
  accountId: string;
  /** Amount in the account's native currency. Assets increase with positive amounts. */
  amount: Money;
  /** Accounting amount in NIO, calculated with the rate captured by the transaction. */
  amountBase: Money;
  /** NIO per unit of the original currency; required when the entry is not NIO. */
  exchangeRateToBase?: bigint;
}

/** A real, immutable financial fact. Planned and pending events do not belong here. */
export interface LedgerTransaction {
  id: string;
  occurredOn: ISODate;
  status: "posted" | "voided";
  entries: LedgerEntry[];
  reversalOf?: string;
}

export interface Reservation {
  id: string;
  accountId: string;
  amount: Money;
  status: "active" | "released" | "consumed";
  purpose: string;
}

export interface Obligation {
  id: string;
  amount: Money;
  fundingStatus: "unfunded" | "funded" | "settled";
}

export type FundingPurpose = "PERSONAL_INCOME" | "EARMARKED" | "REFUND" | "TRANSFER";

export interface IncomeReceipt {
  id: string;
  fundingPurpose: FundingPurpose;
  grossAmount: Money;
  compensationAmount: Money;
  earmarkPurpose?: string;
}

export interface SavingRule {
  amount: Money;
}

export interface PlannedFinancialEvent {
  id: string;
  occursOn: ISODate;
  kind: "income" | "expense";
  amount: Money;
  status: "expected" | "scheduled" | "omitted";
  active?: boolean;
}
