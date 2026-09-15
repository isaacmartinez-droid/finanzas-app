import type { ISODate, ProjectionLine } from "@/types/finance";
import { Badge } from "@/components/ui/Badge";
import { Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { MoneyValue } from "./MoneyValue";

export interface ProjectionCardProps {
  amount: number;
  date: ISODate;
  lines: ProjectionLine[];
  className?: string;
}

/**
 * Estimated free money on payday, before the salary. Deliberately secondary:
 * flat, dashed border, smaller number (spec §38).
 */
export function ProjectionCard({ amount, date, lines, className }: ProjectionCardProps) {
  return (
    <section
      aria-labelledby="projection-title"
      className={cn("rounded-card border border-dashed border-line-strong bg-subtle p-3.5", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <Eyebrow as="h2" id="projection-title">
          Proyección al {formatDayMonth(date)}
        </Eyebrow>
        <Badge tone="outline">Proyectado</Badge>
      </div>
      <p className="mt-1.5 text-[22px] font-bold leading-7 text-ink">
        <MoneyValue amount={amount} decimals={2} approx tone="inherit" />
      </p>
      <p className="text-[13px] leading-5 text-ink-2">Dinero libre estimado antes de tu salario</p>

      <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-ink-2">Incluye</p>
      <ul className="mt-1 space-y-1 text-[14px]">
        {lines.map((l) => (
          <li key={l.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-ink-2">{l.label}</span>
            <MoneyValue
              amount={l.amount}
              sign={l.id === "free" ? "auto" : "always"}
              tone={l.amount > 0 && l.id !== "free" ? "info" : "default"}
              className="shrink-0 font-semibold"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
