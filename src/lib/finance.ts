import type {
  Account,
  Budget,
  FinanceState,
  FinancialSnapshot,
  FinancialStatus,
  PaceBreakdown,
  ProjectionLine,
  Transaction,
} from "@/types/finance";
import { daysBetween, formatDayMonth } from "./dates";
import { round2, toNio } from "./format";

const sum = (values: number[]) => round2(values.reduce((acc, v) => acc + v, 0));

export const operationalAccounts = (accounts: Account[]) => accounts.filter((a) => a.kind === "operational");
export const savingsAccounts = (accounts: Account[]) => accounts.filter((a) => a.kind === "savings");

/**
 * Canonical status (spec §16). Every screen reads it from here so no two
 * screens can disagree.
 *
 * - Déficit:   obligations (reserves + commitments) exceed the operating balance.
 * - En riesgo: covering everything would eat into the cushion (free < 0).
 * - Ajustado:  free money exists but is below the comfortable daily target.
 * - Cómodo:    free money covers the comfortable daily target until payday.
 */
export function computeStatus(input: {
  operating: number;
  reserved: number;
  committed: number;
  free: number;
  comfortThreshold: number;
}): FinancialStatus {
  if (input.operating < input.reserved + input.committed) return "deficit";
  if (input.free < 0) return "risk";
  if (input.free < input.comfortThreshold) return "tight";
  return "comfortable";
}

/** Share of free money spread across the remaining days; the rest stays as margin for surprises. */
export const PACE_SHARE: Record<FinancialStatus, number> = {
  comfortable: 0.6,
  tight: 0.4,
  risk: 0,
  deficit: 0,
};

export function computePace(free: number, status: FinancialStatus, days: number): PaceBreakdown {
  const share = PACE_SHARE[status];
  const available = Math.max(0, free);
  let daily = Math.round((available * share) / days / 10) * 10;
  if (daily * days > available) daily = Math.floor(available / days / 10) * 10;
  const distributable = round2(daily * days);
  return { share, daily, distributable, conserved: round2(available - distributable) };
}

export const isUpcoming = (t: Transaction) =>
  (t.status === "expected" || t.status === "scheduled") && t.recurrence?.active !== false;

/** Amount already spent against a category budget during the current pay cycle. */
export function budgetSpent(state: FinanceState, budget: Budget): number {
  return sum(
    state.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.status === "paid" &&
          t.date >= state.cycleStart &&
          t.date <= state.today &&
          (t.categoryId === budget.categoryId ||
            (budget.categoryId === "food" && t.categoryId === "groceries")),
      )
      .map((t) => toNio(t.amount, t.currency, state.exchangeRate)),
  );
}

/** Events strictly between today and payday that move free money. */
function eventsBeforePayday(state: FinanceState): Transaction[] {
  return state.transactions
    .filter((t) => isUpcoming(t) && t.date > state.today && t.date < state.payday.date)
    .filter((t) => t.type === "income" || t.type === "expense")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getSnapshot(state: FinanceState): FinancialSnapshot {
  const operating = sum(operationalAccounts(state.accounts).map((a) => a.balance));
  const protectedSavings = sum(savingsAccounts(state.accounts).map((a) => a.balance));
  const reserved = sum(state.reserves.map((r) => r.amount));
  const committed = sum(state.commitments.map((c) => c.amount));
  const cushion = state.cushion;

  const free = round2(operating - reserved - committed - cushion);
  const daysRemaining = Math.max(1, daysBetween(state.today, state.payday.date));
  const cycleDays = Math.max(1, daysBetween(state.cycleStart, state.payday.date));
  const comfortThreshold = round2(state.comfortDailyTarget * daysRemaining);
  const status = computeStatus({ operating, reserved, committed, free, comfortThreshold });
  const pace = computePace(free, status, daysRemaining);

  const netChange = sum(state.changesToday.map((c) => c.delta));

  const lines: ProjectionLine[] = [{ id: "free", label: "Dinero libre hoy", amount: free }];
  for (const event of eventsBeforePayday(state)) {
    const nio = round2(toNio(event.amount, event.currency, state.exchangeRate));
    lines.push({
      id: event.id,
      label: `${event.title} · ${formatDayMonth(event.date)}`,
      amount: event.type === "income" ? nio : -nio,
      date: event.date,
    });
  }
  if (pace.distributable > 0) {
    lines.push({
      id: "pace",
      // No amounts inside labels: privacy mode only masks <MoneyValue>.
      label: `Ritmo recomendado · ${daysRemaining} días`,
      amount: -pace.distributable,
    });
  }

  return {
    operating,
    reserved,
    committed,
    cushion,
    protectedSavings,
    free,
    spendableToday: Math.min(Math.max(0, free), operating),
    shortfall: round2(Math.max(0, -free)),
    daysRemaining,
    cycleDays,
    status,
    comfortThreshold,
    pace,
    yesterdayFree: round2(free - netChange),
    netChange,
    projection: { amount: sum(lines.map((l) => l.amount)), date: state.payday.date, lines },
    pendingSavingsTransfer: sum(state.reserves.filter((r) => r.purpose === "savings").map((r) => r.amount)),
  };
}

export function nextIncome(state: FinanceState): Transaction | undefined {
  return state.transactions
    .filter((t) => t.type === "income" && t.status === "expected" && t.date >= state.today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function lastReceivedIncome(state: FinanceState): Transaction | undefined {
  return state.transactions
    .filter((transaction) => transaction.type === "income" && transaction.status === "received")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** Today's realized movements plus everything scheduled until payday. */
export function timelineEvents(state: FinanceState): Transaction[] {
  const today = state.transactions.filter(
    (t) => t.date === state.today && (t.status === "paid" || t.status === "received"),
  );
  const upcoming = state.transactions
    .filter((t) => isUpcoming(t) && t.date >= state.today && t.date <= state.payday.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  return [...today, ...upcoming];
}
