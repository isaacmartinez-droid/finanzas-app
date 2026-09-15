import type { Account, CategoryId, Currency, ISODate, Transaction } from "@/types/finance";
import { CATEGORIES } from "@/lib/categories";
import { addDays, parseISODate } from "@/lib/dates";
import { isUpcoming } from "@/lib/finance";

export type TypeFilter = "all" | "expense" | "income" | "reserve";
export type PeriodFilter = "month" | "week" | "today";
export type StatusFilter = "all" | "done" | "upcoming" | "omitted";

export interface TransactionFilters {
  period: PeriodFilter;
  type: TypeFilter;
  category: CategoryId | "all";
  account: string;
  status: StatusFilter;
  currency: Currency | "all";
}

export const DEFAULT_FILTERS: TransactionFilters = {
  period: "month",
  type: "all",
  category: "all",
  account: "all",
  status: "all",
  currency: "all",
};

/** Filters that live in the sheet (type has its own chips, so it isn't counted). */
export function activeFilterCount(f: TransactionFilters): number {
  return (["period", "category", "account", "status", "currency"] as const).filter((k) => f[k] !== DEFAULT_FILTERS[k]).length;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function inPeriod(date: ISODate, period: PeriodFilter, today: ISODate): boolean {
  if (period === "today") return date === today;
  if (period === "week") {
    const d = parseISODate(today).getDay(); // 0 = Sunday
    const monday = addDays(today, -((d + 6) % 7));
    return date >= monday && date <= addDays(monday, 6);
  }
  return date.slice(0, 7) === today.slice(0, 7);
}

export function filterTransactions(
  list: Transaction[],
  f: TransactionFilters,
  query: string,
  accounts: Account[],
  today: ISODate,
): Transaction[] {
  const q = normalize(query.trim());
  return list.filter((t) => {
    if (!inPeriod(t.date, f.period, today)) return false;
    if (f.type === "reserve" ? !(t.type === "reserve" || t.type === "transfer") : f.type !== "all" && t.type !== f.type)
      return false;
    if (f.category !== "all" && t.categoryId !== f.category && !(f.category === "food" && t.categoryId === "groceries"))
      return false;
    if (f.account !== "all" && t.accountId !== f.account && t.toAccountId !== f.account) return false;
    if (f.currency !== "all" && t.currency !== f.currency) return false;
    if (f.status === "upcoming" && !isUpcoming(t)) return false;
    if (f.status === "omitted" && t.status !== "omitted") return false;
    if (f.status === "done" && (isUpcoming(t) || t.status === "omitted")) return false;
    if (q) {
      const account = accounts.find((a) => a.id === t.accountId)?.name ?? "";
      const haystack = normalize(`${t.title} ${CATEGORIES[t.categoryId].label} ${account}`);
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface GroupedTransactions {
  today: Transaction[];
  upcoming: Transaction[];
  past: Transaction[];
}

/** Hoy → Próximos → Anteriores (spec §43). */
export function groupTransactions(list: Transaction[], today: ISODate): GroupedTransactions {
  const upcoming = list.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date));
  const realized = list.filter((t) => !isUpcoming(t));
  return {
    today: realized.filter((t) => t.date === today),
    upcoming,
    past: realized.filter((t) => t.date < today).sort((a, b) => b.date.localeCompare(a.date)),
  };
}
