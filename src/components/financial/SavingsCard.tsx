import { Lock, PiggyBank } from "lucide-react";
import type { SavingsGoal } from "@/types/finance";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { MoneyValue } from "./MoneyValue";

export interface SavingsCardProps {
  /** Real, protected savings (separate account). */
  protectedAmount: number;
  /** Reserved inside operational accounts, pending transfer. */
  pendingTransfer: number;
  goal: SavingsGoal;
  className?: string;
}

/** Distinguishes real savings, reserved savings and the goal (spec §33). */
export function SavingsCard({ protectedAmount, pendingTransfer, goal, className }: SavingsCardProps) {
  const pct = protectedAmount / goal.target;
  return (
    <Card aria-labelledby="savings-title" className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow as="h2" id="savings-title">
            Ahorro protegido
          </Eyebrow>
          <p className="mt-1 text-[22px] font-bold leading-7">
            <MoneyValue amount={protectedAmount} />
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-saving-bg text-saving">
          <PiggyBank aria-hidden size={18} strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-ink-2">
          Meta <MoneyValue amount={goal.target} tone="inherit" className="font-semibold text-ink" /> · {goal.name}
        </span>
        <span className="money font-bold text-saving">{formatPercent(pct)}</span>
      </div>

      <Progress
        className="mt-2"
        value={protectedAmount}
        secondary={pendingTransfer}
        max={goal.target}
        label={`Progreso de ${goal.name}`}
        valueText={`${formatPercent(pct)} de la meta`}
      />

      {pendingTransfer > 0 && (
        <p className="mt-3 flex items-start gap-2 text-[13px] leading-5 text-ink-2">
          <Lock aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-saving" />
          <span>
            <MoneyValue amount={pendingTransfer} tone="saving" className="font-semibold" /> reservados pendientes de
            transferir
          </span>
        </p>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2" aria-label="Leyenda">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-saving" /> Ahorro real
        </li>
        {pendingTransfer > 0 && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="striped-saving size-2.5 rounded-full" /> Reservado
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-saving-bg ring-1 ring-saving/30" /> Falta para la meta
        </li>
      </ul>
    </Card>
  );
}
