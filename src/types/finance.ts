/** ISO calendar date, `YYYY-MM-DD` (no time, no timezone). */
export type ISODate = string;

export type Currency = "NIO" | "USD";

/** Canonical financial state shared by every screen (spec §16). */
export type FinancialStatus = "comfortable" | "tight" | "risk" | "deficit";

export type AccountKind = "operational" | "savings";

export interface Account {
  id: string;
  name: string;
  /** Short label used in lists: "Banpro", "Efectivo"… */
  shortName: string;
  kind: AccountKind;
  /** Balance in NIO. */
  balance: number;
}

export interface Reserve {
  id: string;
  name: string;
  /** Amount in NIO, kept inside an operational account. */
  amount: number;
  purpose: "savings" | "expense";
  accountId: string;
  targetDate?: ISODate;
  note?: string;
}

/** A category spending limit for the current pay cycle. */
export interface Budget {
  id: string;
  categoryId: CategoryId;
  /** Limit in NIO. Budgets organize spending; they do not reserve money. */
  amount: number;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  dueDate: ISODate;
}

export type TransactionType = "expense" | "income" | "reserve" | "transfer";

export type TransactionStatus =
  | "paid"
  | "received"
  | "expected"
  | "scheduled"
  | "omitted"
  | "reserved"
  | "transferred";

export type CategoryId =
  | "food"
  | "groceries"
  | "maintenance"
  | "transport"
  | "health"
  | "services"
  | "leisure"
  | "salary"
  | "family"
  | "savings"
  | "transfer"
  | "other";

export interface AmountLine {
  label: string;
  /** Signed amount in the transaction currency. */
  amount: number;
}

export interface Recurrence {
  frequency: "Semanal" | "Quincenal" | "Mensual";
  nextDate?: ISODate;
  /** Paused series stay visible in Plan but leave projections until resumed. */
  active?: boolean;
}

export interface Transaction {
  id: string;
  date: ISODate;
  title: string;
  categoryId: CategoryId;
  accountId?: string;
  /** Destination account for transfers. */
  toAccountId?: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Always a positive magnitude; direction comes from `type`. */
  amount: number;
  currency: Currency;
  recurrence?: Recurrence;
  breakdown?: AmountLine[];
  note?: string;
}

/** One reason today's free money differs from yesterday's. */
export interface DailyChange {
  id: string;
  label: string;
  /** Signed effect on free money, NIO. */
  delta: number;
}

export interface Payday {
  date: ISODate;
  label: string;
  amount: number;
  currency: Currency;
}

export interface SavingsGoal {
  name: string;
  target: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  initials: string;
}

/** Raw financial state — what a future API would return. */
export interface FinanceState {
  today: ISODate;
  /** Last payday; start of the current cycle. */
  cycleStart: ISODate;
  payday: Payday;
  /** NIO per 1 USD. */
  exchangeRate: number;
  /** Operational cushion that daily spending must not touch. */
  cushion: number;
  /** Daily amount considered "comfortable" until payday. */
  comfortDailyTarget: number;
  accounts: Account[];
  reserves: Reserve[];
  budgets: Budget[];
  commitments: Commitment[];
  transactions: Transaction[];
  changesToday: DailyChange[];
  savingsGoal: SavingsGoal;
}

export type ScenarioId = "comfortable" | "tight" | "risk" | "deficit" | "extreme";

export interface ProjectionLine {
  id: string;
  label: string;
  amount: number;
  date?: ISODate;
}

export interface PaceBreakdown {
  /** Share of free money distributed across remaining days. */
  share: number;
  daily: number;
  distributable: number;
  conserved: number;
}

/** Derived numbers — computed once from `FinanceState`, never hand-written. */
export interface FinancialSnapshot {
  operating: number;
  reserved: number;
  committed: number;
  cushion: number;
  protectedSavings: number;
  /** operating − reserved − committed − cushion. May be negative. */
  free: number;
  /** What the hero shows: never below zero, never above `operating`. */
  spendableToday: number;
  /** How much is missing to keep every protection intact. */
  shortfall: number;
  daysRemaining: number;
  cycleDays: number;
  status: FinancialStatus;
  comfortThreshold: number;
  pace: PaceBreakdown;
  yesterdayFree: number;
  netChange: number;
  projection: { amount: number; date: ISODate; lines: ProjectionLine[] };
  pendingSavingsTransfer: number;
}
