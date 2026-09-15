import { CalendarClock, ChevronRight, Lock, PencilLine } from "lucide-react";
import type { AlternativeOption } from "@/features/simulator/simulate";
import { cn } from "@/lib/cn";
import { FINANCIAL_STATUS } from "@/lib/status";
import { MoneyValue } from "./MoneyValue";

const actionIcon = { edit: PencilLine, postpone: CalendarClock, reserve: Lock } as const;

export interface DecisionAlternativesProps {
  options: AlternativeOption[];
  selectedId?: string;
  paydayLabel: string;
  onChoose: (option: AlternativeOption) => void;
  className?: string;
}

/** Selectable ways to go ahead (amount options) plus follow-up actions. */
export function DecisionAlternatives({ options, selectedId, paydayLabel, onChoose, className }: DecisionAlternativesProps) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {options.map((o) => {
        const selectable = o.action === "select";
        const selected = selectable && o.id === selectedId;
        const Icon = selectable ? null : actionIcon[o.action as keyof typeof actionIcon];
        const status = o.statusAfter ? FINANCIAL_STATUS[o.statusAfter] : null;
        return (
          <li key={o.id}>
            <button
              type="button"
              aria-pressed={selectable ? selected : undefined}
              onClick={() => onChoose(o)}
              className="-mx-2 flex min-h-[52px] w-[calc(100%+1rem)] items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition-colors duration-150 hover:bg-subtle"
            >
              {selectable ? (
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border-2",
                    selected ? "border-primary" : "border-line-strong",
                  )}
                >
                  {selected && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
              ) : (
                Icon && <Icon aria-hidden size={18} strokeWidth={1.8} className="shrink-0 text-ink-2" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-5 text-ink">{o.label}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-ink-2">
                  {o.action === "select" && o.marginAfter !== undefined && (
                    <>
                      Pagas <MoneyValue amount={o.amountNio ?? 0} tone="inherit" /> · margen{" "}
                      <MoneyValue amount={o.marginAfter} tone="inherit" className="font-semibold text-ink" />
                      {status && ` · ${status.label}`}
                    </>
                  )}
                  {o.action === "edit" && "Cambia el monto y vuelve a simular"}
                  {o.action === "reserve" && o.perDay !== undefined && (
                    <>
                      Aparta ≈<MoneyValue amount={o.perDay} tone="inherit" className="font-semibold text-ink" />/día hasta el{" "}
                      {paydayLabel}
                    </>
                  )}
                  {o.action === "postpone" && o.afterPaydayMargin !== undefined && (
                    <>
                      Tras el salario te quedarían ≈
                      <MoneyValue amount={o.afterPaydayMargin} decimals={0} tone="inherit" className="font-semibold text-ink" />
                    </>
                  )}
                </span>
              </span>
              {!selectable && <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-3" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
