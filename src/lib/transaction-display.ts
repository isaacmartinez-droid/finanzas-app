import { CalendarClock, CirclePause, type LucideIcon } from "lucide-react";
import type { Account, ISODate, Transaction } from "@/types/finance";
import type { MoneyTone } from "@/components/financial/MoneyValue";
import type { SignMode } from "./format";
import { CATEGORIES } from "./categories";
import { daysBetween, formatDayMonth, formatRelativeDay, pluralDays } from "./dates";
import { isUpcoming } from "./finance";

export interface TransactionVisual {
  icon: LucideIcon;
  /** Soft icon-box background by movement nature (keeps the strict color meanings). */
  boxClass: string;
  amount: number;
  sign: SignMode;
  tone: MoneyTone;
  strike: boolean;
  upcoming: boolean;
}

/** How a movement looks: icon, icon box, signed amount and tone. Shared by list and table. */
export function transactionVisual(t: Transaction): TransactionVisual {
  const upcoming = isUpcoming(t);
  const category = CATEGORIES[t.categoryId];

  if (t.status === "omitted") {
    return {
      icon: CirclePause,
      boxClass: "bg-neutral-bg text-ink-2",
      amount: t.amount,
      sign: "never",
      tone: "muted",
      strike: true,
      upcoming: false,
    };
  }

  if (upcoming) {
    const income = t.type === "income";
    return {
      icon: CalendarClock,
      boxClass: income
        ? "border border-dashed border-info/50 bg-info-bg text-info"
        : "border border-dashed border-line-strong bg-subtle text-ink-2",
      amount: t.type === "expense" ? -t.amount : t.amount,
      sign: income ? "always" : t.type === "expense" ? "auto" : "never",
      tone: income ? "info" : t.type === "transfer" ? "saving" : "default",
      strike: false,
      upcoming: true,
    };
  }

  switch (t.type) {
    case "income":
      return { icon: category.icon, boxClass: "bg-positive-bg text-positive", amount: t.amount, sign: "always", tone: "positive", strike: false, upcoming: false };
    case "reserve":
      return { icon: category.icon, boxClass: "bg-saving-bg text-saving", amount: t.amount, sign: "never", tone: "saving", strike: false, upcoming: false };
    case "transfer":
      return { icon: category.icon, boxClass: "bg-info-bg text-info", amount: t.amount, sign: "never", tone: "info", strike: false, upcoming: false };
    default:
      return { icon: category.icon, boxClass: "bg-neutral-bg text-neutral", amount: -t.amount, sign: "auto", tone: "default", strike: false, upcoming: false };
  }
}

export function transactionMeta(t: Transaction, accounts: Account[]): string {
  // An omitted occurrence must read as "didn't happen, recurrence continues" (spec §50).
  if (t.status === "omitted" && t.recurrence) {
    return t.recurrence.nextDate ? `Sigue el ${formatDayMonth(t.recurrence.nextDate)}` : "La recurrencia continúa";
  }
  const account = accounts.find((a) => a.id === t.accountId);
  if (t.type === "transfer") {
    const to = accounts.find((a) => a.id === t.toAccountId);
    return [account?.shortName, to?.shortName].filter(Boolean).join(" → ");
  }
  return [CATEGORIES[t.categoryId].label, account?.shortName].filter(Boolean).join(" · ");
}

/** "Hoy", "Ayer", "14 Sep" or, with `countdown`, "20 Sep · en 5 días" for upcoming items. */
export function transactionDateLabel(t: Transaction, today: ISODate, countdown = false): string {
  if (countdown && isUpcoming(t)) {
    const d = daysBetween(today, t.date);
    return d <= 0 ? formatRelativeDay(t.date, today) : `${formatDayMonth(t.date)} · en ${pluralDays(d)}`;
  }
  return formatRelativeDay(t.date, today);
}
