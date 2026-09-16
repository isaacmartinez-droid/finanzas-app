import { ChevronRight } from "lucide-react";
import { MoneyValue } from "./MoneyValue";

export interface BreakdownLine {
  id: string;
  label: string;
  /** Signed: negative lines subtract. */
  amount: number;
  hint?: string;
}

/**
 * Saldo operativo − Reservas − Compromisos − Colchón = Dinero libre.
 * Every line is clickable and explains itself (spec §40).
 */
export function CashFlowBreakdown({
  lines,
  total,
  onSelect,
  className,
}: {
  lines: BreakdownLine[];
  total: { label: string; amount: number };
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <ul>
        {lines.map((line) => {
          const content = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-ink">{line.label}</span>
                {line.hint && <span className="block truncate text-[12px] leading-4 text-ink-2">{line.hint}</span>}
              </span>
              <MoneyValue amount={line.amount} className="text-[15px] font-semibold" />
              {onSelect && <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-3" />}
            </>
          );
          return (
            <li key={line.id}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(line.id)}
                  className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition-colors duration-150 hover:bg-subtle"
                >
                  {content}
                </button>
              ) : (
                <div className="flex min-h-10 items-center gap-2 py-1">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3 pr-6">
        <span className="text-[15px] font-bold text-ink">{total.label}</span>
        <MoneyValue
          amount={total.amount}
          decimals={2}
          tone={total.amount < 0 ? "risk" : "default"}
          className="text-[18px] font-bold"
        />
      </div>
    </div>
  );
}
