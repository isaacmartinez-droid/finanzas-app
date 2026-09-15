import type { Currency, FinanceState, ISODate, Transaction, TransactionStatus } from "@/types/finance";
import type { MoneyTone } from "@/components/financial/MoneyValue";
import type { SignMode } from "./format";
import { toNio } from "./format";

export type TimelineMarker = "now" | "done" | "income" | "expense" | "saving" | "payday";

export interface TimelineEntry {
  id: string;
  date: ISODate;
  title: string;
  amount?: number;
  currency?: Currency;
  sign?: SignMode;
  tone?: MoneyTone;
  /** Converted value shown under USD amounts ("≈ C$6,409"). */
  approxNio?: number;
  status?: TransactionStatus;
  marker: TimelineMarker;
  transaction?: Transaction;
}

export function toTimelineEntry(t: Transaction, state: FinanceState): TimelineEntry {
  const isIncome = t.type === "income";
  const isPayday = isIncome && t.date === state.payday.date && t.categoryId === "salary";
  const marker: TimelineMarker =
    t.date === state.today && (t.status === "paid" || t.status === "received")
      ? "done"
      : isPayday
        ? "payday"
        : isIncome
          ? "income"
          : t.type === "expense"
            ? "expense"
            : "saving";

  return {
    id: t.id,
    date: t.date,
    title: t.title,
    amount: t.type === "expense" ? -t.amount : t.amount,
    currency: t.currency,
    sign: isIncome ? "always" : t.type === "expense" ? "auto" : "never",
    tone: isIncome ? (t.status === "received" ? "positive" : "info") : t.type === "expense" ? "default" : "saving",
    approxNio: t.currency === "USD" ? toNio(t.amount, "USD", state.exchangeRate) : undefined,
    status: t.status,
    marker,
    transaction: t,
  };
}
