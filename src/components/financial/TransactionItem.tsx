import type { Account, ISODate, Transaction } from "@/types/finance";
import { cn } from "@/lib/cn";
import { transactionDateLabel, transactionMeta, transactionVisual } from "@/lib/transaction-display";
import { TransactionStatusBadge } from "./FinancialStatusBadge";
import { MoneyValue } from "./MoneyValue";

export interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  today: ISODate;
  /** Hide the date when the surrounding section already says "Hoy". */
  showDate?: boolean;
  onSelect?: (t: Transaction) => void;
}

/**
 * [Icon]  Supermercado             −C$425
 *         Alimentación · Banpro   Pagado
 * 58–70px tall; long titles truncate to one line (full text in the detail sheet).
 */
export function TransactionItem({ transaction: t, accounts, today, showDate = true, onSelect }: TransactionItemProps) {
  const v = transactionVisual(t);
  const Icon = v.icon;
  const meta = transactionMeta(t, accounts);
  const date = transactionDateLabel(t, today);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(t)}
      className="flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-subtle focus-visible:-outline-offset-2"
    >
      <span className={cn("grid size-[38px] shrink-0 place-items-center rounded-[10px]", v.boxClass)}>
        <Icon aria-hidden size={18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px] font-semibold leading-5 text-ink">{t.title}</span>
          <MoneyValue
            amount={v.amount}
            currency={t.currency}
            sign={v.sign}
            tone={v.tone}
            strike={v.strike}
            className="shrink-0 text-[15px] font-semibold leading-5"
          />
        </span>
        <span className="mt-1 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[13px] leading-5 text-ink-2">
            {meta}
            {showDate && t.status !== "omitted" && ` · ${date}`}
          </span>
          <TransactionStatusBadge status={t.status} />
        </span>
      </span>
    </button>
  );
}
