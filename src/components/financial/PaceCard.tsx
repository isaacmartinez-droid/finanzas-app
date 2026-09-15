import { Gauge } from "lucide-react";
import type { FinancialStatus, PaceBreakdown } from "@/types/finance";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";
import { FINANCIAL_STATUS } from "@/lib/status";
import { MoneyValue } from "./MoneyValue";

export interface PaceCardProps {
  pace: PaceBreakdown;
  free: number;
  daysRemaining: number;
  status: FinancialStatus;
  className?: string;
}

/** "C$50 / día" plus a disclosure that explains every step — no unexplainable figures (spec §39). */
export function PaceCard({ pace, free, daysRemaining, status, className }: PaceCardProps) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Dinero libre", value: <MoneyValue amount={free} decimals={2} /> },
    { label: "Margen extra conservado", value: <MoneyValue amount={-pace.conserved} decimals={2} /> },
    { label: "Monto distribuible", value: <MoneyValue amount={pace.distributable} /> },
    { label: "Días restantes", value: <span className="money">{daysRemaining}</span> },
  ];

  return (
    <Card aria-labelledby="pace-title" className={className}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="pace-title" className="text-[15px] font-bold leading-5 text-ink">
            Ritmo recomendado
          </h2>
          <p className="mt-1 text-[22px] font-bold leading-7 text-ink">
            <MoneyValue amount={pace.daily} /> <span className="text-[15px] font-semibold text-ink-2">/ día</span>
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
          <Gauge aria-hidden size={18} strokeWidth={1.8} />
        </span>
      </div>

      <Accordion
        className="mt-1"
        buttonClassName="text-[14px] text-primary"
        title={
          <>
            ¿Por qué <MoneyValue amount={pace.daily} tone="inherit" />?
          </>
        }
      >
        <dl className="space-y-2 pb-1 pt-1 text-[14px]">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-2">{r.label}</dt>
              <dd className="font-semibold">{r.value}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
            <dt className="font-bold text-ink">Por día</dt>
            <dd className="text-[16px] font-bold">
              <MoneyValue amount={pace.daily} approx />
              <span className="text-ink-2">/día</span>
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-[13px] leading-5 text-ink-2">
          {pace.share > 0 ? (
            <>
              Como tu estado es <strong className="font-semibold text-ink">{FINANCIAL_STATUS[status].label}</strong>,
              repartimos el {formatPercent(pace.share)} de tu dinero libre en los días que faltan y conservamos el resto
              para imprevistos. Los ingresos esperados no se cuentan hasta que llegan.
            </>
          ) : (
            <>Tu dinero libre no alcanza para cubrir tus protecciones, así que no hay monto para repartir. Pausa los gastos no esenciales.</>
          )}
        </p>
      </Accordion>
    </Card>
  );
}
