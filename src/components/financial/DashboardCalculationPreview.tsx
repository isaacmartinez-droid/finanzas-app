"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FinancialSnapshot } from "@/types/finance";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CashFlowBreakdown } from "./CashFlowBreakdown";

type CalculationSnapshot = Pick<
  FinancialSnapshot,
  "operating" | "reserved" | "committed" | "cushion" | "free"
>;

export interface DashboardCalculationPreviewProps {
  snapshot: CalculationSnapshot;
  className?: string;
}

/** Compact disclosure of the canonical free-money snapshot; no formulas are recomputed here. */
export function DashboardCalculationPreview({ snapshot, className }: DashboardCalculationPreviewProps) {
  const [open, setOpen] = useState(false);
  const detailId = useId();

  return (
    <div className={cn("border-t border-line pt-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-[12px] leading-5 text-ink-2">
          Saldo operativo − reservado − comprometido − colchón = dinero libre
        </p>
        <Button
          variant="tertiary"
          size="sm"
          className="-my-2 -mr-2 min-h-10 px-2 text-[13px]"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Ocultar cálculo" : "Ver cálculo"}
          <ChevronDown
            aria-hidden
            size={16}
            strokeWidth={1.8}
            className={cn("transition-transform duration-150", open && "rotate-180")}
          />
        </Button>
      </div>

      {open && (
        <div id={detailId} className="pt-2">
          <CashFlowBreakdown
            lines={[
              { id: "operating", label: "Saldo operativo", amount: snapshot.operating },
              { id: "reserved", label: "Reservado", amount: -snapshot.reserved },
              { id: "committed", label: "Comprometido", amount: -snapshot.committed },
              { id: "cushion", label: "Colchón", amount: -snapshot.cushion },
            ]}
            total={{ label: "Dinero libre hoy", amount: snapshot.free }}
          />
          {snapshot.free < 0 && (
            <p className="mt-2 text-[12px] leading-4 text-ink-2">
              El monto principal muestra cero porque el dinero disponible para gastar nunca se presenta como negativo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
