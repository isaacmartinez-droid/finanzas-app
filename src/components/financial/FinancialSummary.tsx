import { cn } from "@/lib/cn";
import { MoneyValue, type MoneyTone } from "./MoneyValue";

export interface SummaryItem {
  id: string;
  label: string;
  amount: number;
  tone?: MoneyTone;
  /** Small colored marker that ties the figure to its meaning (violet = reserved/protected). */
  marker?: "operating" | "reserved" | "committed" | "savings" | "cushion";
}

const markerClass: Record<NonNullable<SummaryItem["marker"]>, string> = {
  operating: "bg-primary",
  reserved: "bg-saving-soft",
  committed: "bg-line-strong",
  savings: "bg-saving",
  cushion: "bg-warning",
};

/** 2×2 grid inside the hero (spec §27). */
export function FinancialSummary({ items, className }: { items: SummaryItem[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-3 gap-y-3 rounded-inner bg-subtle p-3", className)}>
      {items.map((item) => (
        <div key={item.id} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[12px] font-medium leading-4 text-ink-2">
            {item.marker && <span aria-hidden className={cn("size-2 shrink-0 rounded-full", markerClass[item.marker])} />}
            <span className="truncate">{item.label}</span>
          </dt>
          <dd className="mt-1 truncate text-[16px] font-bold leading-6">
            <MoneyValue amount={item.amount} decimals={0} tone={item.tone ?? "default"} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
