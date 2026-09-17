import {
  calculateFinancialPosition,
  projectFreeMoney,
  type FinancialPosition,
} from "@/domain/financial-engine/engine";
import { exchangeRate, money, toBase, type Money } from "@/domain/financial-engine/money";
import type { LedgerAccount, Obligation, PlannedFinancialEvent, Reservation } from "@/domain/financial-engine/types";
import { round2, toNio } from "@/lib/format";
import type { FinanceState, Transaction } from "@/types/finance";

export interface AdaptedPlannedEvent {
  source: Transaction;
  event: PlannedFinancialEvent;
}

export interface AdaptedFinanceState {
  position: FinancialPosition;
  reservationTotal: Money;
  obligationTotal: Money;
  protectedSavings: Money;
  plannedEvents: AdaptedPlannedEvent[];
  projectedFreeMoney: Money;
}

export interface FinancialEngineParity {
  operating: boolean;
  reserved: boolean;
  committed: boolean;
  free: boolean;
  projectionBeforePace: boolean;
}

const toNioMoney = (value: number) => money("NIO", round2(value).toFixed(2));
const toNumber = (value: Money) => Number(value.minor) / 100;

/**
 * Bridges the current mock state to the new domain without inventing history.
 * Mock account balances are already post-history, so they become opening
 * balances and the legacy transaction list is used only for planning/display.
 */
export function adaptFinanceState(state: FinanceState): AdaptedFinanceState {
  const accounts: LedgerAccount[] = state.accounts.map((account) => {
    const balance = toNioMoney(account.balance);
    return {
      id: account.id,
      kind: account.kind,
      currency: "NIO",
      openingBalance: balance,
      openingBalanceBase: balance,
      currentBalanceCache: balance,
      currentBalanceCacheBase: balance,
    };
  });
  const reservations: Reservation[] = state.reserves.map((reserve) => ({
    id: reserve.id,
    accountId: reserve.accountId,
    amount: toNioMoney(reserve.amount),
    status: "active",
    purpose: reserve.purpose,
  }));
  const obligations: Obligation[] = state.commitments.map((commitment) => ({
    id: commitment.id,
    amount: toNioMoney(commitment.amount),
    fundingStatus: "unfunded",
  }));
  const position = calculateFinancialPosition({
    accounts,
    transactions: [],
    reservations,
    obligations,
    operatingCushion: toNioMoney(state.cushion),
  });
  const rate = exchangeRate(state.exchangeRate.toFixed(8));
  const plannedEvents = state.transactions
    .filter(isProjectedPlanningTransaction)
    .map((source) => ({
      source,
      event: {
        id: source.id,
        occursOn: source.date,
        kind: source.type,
        amount: toBase(money(source.currency, source.amount.toFixed(2)), rate),
        status: source.status,
        active: source.recurrence?.active,
      },
    } satisfies AdaptedPlannedEvent));
  const projectedFreeMoney = projectFreeMoney({
    currentFreeMoney: position.freeMoney,
    today: state.today,
    untilExclusive: state.payday.date,
    events: plannedEvents.map((item) => item.event),
  });
  const protectedSavings = accounts
    .filter((account) => account.kind === "savings")
    .reduce((total, account) => total + account.openingBalanceBase.minor, 0n);

  return {
    position,
    reservationTotal: sumMoney(reservations.map((item) => item.amount)),
    obligationTotal: sumMoney(obligations.map((item) => item.amount)),
    protectedSavings: { currency: "NIO", minor: protectedSavings },
    plannedEvents,
    projectedFreeMoney,
  };
}

/** Comparison used by tests while the frontend state remains in its legacy shape. */
export function financialEngineParity(state: FinanceState): FinancialEngineParity {
  const adapted = adaptFinanceState(state);
  const operating = round2(state.accounts.filter((account) => account.kind === "operational").reduce((total, account) => total + account.balance, 0));
  const reserved = round2(state.reserves.reduce((total, reserve) => total + reserve.amount, 0));
  const committed = round2(state.commitments.reduce((total, commitment) => total + commitment.amount, 0));
  const free = round2(operating - reserved - committed - state.cushion);
  const projectionBeforePace = state.transactions
    .filter((transaction) => (transaction.status === "expected" || transaction.status === "scheduled") && transaction.recurrence?.active !== false)
    .filter((transaction) => transaction.date > state.today && transaction.date < state.payday.date)
    .filter((transaction) => transaction.type === "income" || transaction.type === "expense")
    .reduce((total, transaction) => {
      const amount = round2(toNio(transaction.amount, transaction.currency, state.exchangeRate));
      return round2(total + (transaction.type === "income" ? amount : -amount));
    }, free);

  return {
    operating: operating === toNumber(adapted.position.operatingBalance),
    reserved: reserved === toNumber(adapted.reservationTotal),
    committed: committed === toNumber(adapted.obligationTotal),
    free: free === toNumber(adapted.position.freeMoney),
    projectionBeforePace: projectionBeforePace === toNumber(adapted.projectedFreeMoney),
  };
}

export function moneyToNumber(value: Money): number {
  return toNumber(value);
}

function sumMoney(values: Money[]): Money {
  return { currency: "NIO", minor: values.reduce((total, value) => total + value.minor, 0n) };
}

function isProjectedPlanningTransaction(
  transaction: Transaction,
): transaction is Transaction & { type: "income" | "expense"; status: "expected" | "scheduled" } {
  return (
    (transaction.status === "expected" || transaction.status === "scheduled") &&
    transaction.recurrence?.active !== false &&
    (transaction.type === "income" || transaction.type === "expense")
  );
}
