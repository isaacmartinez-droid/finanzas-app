import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { MoneyValue } from "./MoneyValue";

export type ProtectionState = "kept" | "reduced" | "affected";

export interface ProtectionRow {
  id: string;
  label: string;
  /** "No se toca", "Cubierta", "Se mantiene", "Reducido"… */
  detail: string;
  amount?: number;
  state: ProtectionState;
}

const stateMeta: Record<ProtectionState, { icon: typeof CircleCheck; className: string; sr: string }> = {
  kept: { icon: CircleCheck, className: "text-positive", sr: "Protegido" },
  reduced: { icon: TriangleAlert, className: "text-warning", sr: "Atención" },
  affected: { icon: CircleAlert, className: "text-risk", sr: "Afectado" },
};

/** Rows with separators — not one card per row (spec §59). */
export function ProtectionList({ rows, className }: { rows: ProtectionRow[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {rows.map((row) => {
        const meta = stateMeta[row.state];
        const Icon = meta.icon;
        return (
          <li key={row.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
            <Icon aria-hidden size={18} strokeWidth={1.8} className={cn("shrink-0", meta.className)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-5 text-ink">
                <span className="sr-only">{meta.sr}: </span>
                {row.label}
              </p>
              <p className={cn("text-[13px] leading-5", row.state === "kept" ? "text-ink-2" : meta.className)}>{row.detail}</p>
            </div>
            {row.amount !== undefined && (
              <MoneyValue
                amount={row.amount}
                decimals="auto"
                tone={row.state === "affected" ? "risk" : "default"}
                className="shrink-0 text-[15px] font-semibold"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
