import type { Account, ISODate, Transaction } from "@/types/finance";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { transactionDateLabel, transactionVisual } from "@/lib/transaction-display";
import { TransactionStatusBadge } from "./FinancialStatusBadge";
import { MoneyValue } from "./MoneyValue";

export interface TransactionSection {
  id: string;
  label: string;
  items: Transaction[];
}

/** Desktop table — exactly six columns by default (spec §77). */
export function TransactionTable({
  sections,
  accounts,
  today,
  onSelect,
  className,
}: {
  sections: TransactionSection[];
  accounts: Account[];
  today: ISODate;
  onSelect?: (t: Transaction) => void;
  className?: string;
}) {
  const accountName = (t: Transaction) => {
    const from = accounts.find((a) => a.id === t.accountId)?.shortName;
    if (t.type !== "transfer") return from ?? "—";
    const to = accounts.find((a) => a.id === t.toAccountId)?.shortName;
    return `${from} → ${to}`;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-[14px]">
        <colgroup>
          <col className="w-[16%]" />
          <col className="w-[30%]" />
          <col className="w-[15%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line text-[12px] font-semibold uppercase tracking-[0.05em] text-ink-2">
            <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
            <th scope="col" className="px-4 py-3 font-semibold">Concepto</th>
            <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
            <th scope="col" className="px-4 py-3 font-semibold">Cuenta</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Monto</th>
          </tr>
        </thead>
        {sections.map((section) => (
          <tbody key={section.id}>
            <tr>
              <th
                scope="colgroup"
                colSpan={6}
                className="bg-subtle px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-ink-2"
              >
                {section.label}
                <span className="ml-2 font-medium normal-case tracking-normal">{section.items.length}</span>
              </th>
            </tr>
            {section.items.map((t) => {
              const v = transactionVisual(t);
              const Icon = v.icon;
              return (
                <tr key={t.id} className="relative border-b border-line last:border-b-0 hover:bg-subtle">
                  <td className="px-4 py-3 text-ink-2">{transactionDateLabel(t, today, true)}</td>
                  <td className="px-4 py-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-[9px]", v.boxClass)}>
                        <Icon aria-hidden size={16} strokeWidth={1.8} />
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelect?.(t)}
                        title={t.title}
                        className="min-w-0 truncate text-left font-semibold text-ink after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-[6px] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
                      >
                        {t.title}
                      </button>
                    </span>
                  </td>
                  <td className="truncate px-4 py-3 text-ink-2">{CATEGORIES[t.categoryId].label}</td>
                  <td className="truncate px-4 py-3 text-ink-2">{accountName(t)}</td>
                  <td className="px-4 py-3">
                    <TransactionStatusBadge status={t.status} short />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MoneyValue
                      amount={v.amount}
                      currency={t.currency}
                      sign={v.sign}
                      tone={v.tone}
                      strike={v.strike}
                      className="font-semibold"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
