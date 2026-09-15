import { CircleAlert, CircleCheck, RotateCcw, TriangleAlert } from "lucide-react";
import type { SimulationOutcome, SimulationResultData } from "@/features/simulator/simulate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, LoadingRegion, Skeleton } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { MoneyValue } from "./MoneyValue";

const outcomeMeta: Record<
  SimulationOutcome,
  { eyebrow: string; headline: string; note: string; icon: typeof CircleCheck; band: string; text: string }
> = {
  safe: {
    eyebrow: "Seguro",
    headline: "Puedes realizar esta compra.",
    note: "Mantienes tus protecciones y conservas margen suficiente para imprevistos.",
    icon: CircleCheck,
    band: "bg-positive-bg",
    text: "text-positive",
  },
  tight: {
    eyebrow: "Posible, pero ajustado",
    headline: "Puedes realizar esta compra.",
    note: "Mantienes tus protecciones, pero tendrás poco margen para imprevistos.",
    icon: TriangleAlert,
    band: "bg-warning-bg",
    text: "text-warning",
  },
  "not-recommended": {
    eyebrow: "No recomendado",
    headline: "Esta compra dejaría tu margen en:",
    note: "Tendrías que usar dinero reservado o bajar de tu colchón.",
    icon: CircleAlert,
    band: "bg-risk-bg",
    text: "text-risk",
  },
};

export type SimulationStatus = "loading" | "error" | "ready";

export interface SimulationResultProps {
  status: SimulationStatus;
  result?: SimulationResultData | null;
  onRetry?: () => void;
  className?: string;
}

/** Answers "¿puedo?" and "¿cuánto margen me queda?" in one glance (spec §57, §103). */
export function SimulationResult({ status, result, onRetry, className }: SimulationResultProps) {
  if (status === "loading") {
    return (
      <LoadingRegion label="Calculando impacto…" className={className}>
        <Card padding="none" className="overflow-hidden">
          <div className="space-y-2 bg-subtle px-4 py-3.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-56" />
          </div>
          <div className="space-y-2 px-4 py-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      </LoadingRegion>
    );
  }

  if (status === "error") {
    return (
      <Alert
        role="alert"
        tone="risk"
        title="No pudimos calcular el impacto."
        className={className}
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCcw aria-hidden size={16} strokeWidth={1.8} />
            Intentar nuevamente
          </Button>
        }
      >
        Intenta nuevamente. Lo que escribiste sigue en el formulario.
      </Alert>
    );
  }

  if (!result) return null;
  const meta = outcomeMeta[result.outcome];
  const Icon = meta.icon;

  return (
    <Card padding="none" aria-labelledby="sim-result-title" aria-live="polite" className={cn("overflow-hidden", className)}>
      <div className={cn("px-4 py-3.5", meta.band)}>
        <p id="sim-result-title" className={cn("flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em]", meta.text)}>
          <Icon aria-hidden size={18} strokeWidth={1.8} />
          {meta.eyebrow}
        </p>
        <p className="mt-1 text-[17px] font-bold leading-6 text-ink">{meta.headline}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-[13px] font-semibold text-ink-2">Margen libre después de comprar</p>
        <p className="mt-0.5 text-[30px] font-[750] leading-9 tracking-[-0.02em]">
          <MoneyValue amount={result.marginAfter} decimals={2} tone={result.marginAfter < 0 ? "risk" : "default"} />
        </p>
        <p className="mt-2 text-[14px] leading-5 text-ink-2">{meta.note}</p>
        {result.insufficientAccount && (
          <p className="mt-2 flex items-start gap-2 text-[14px] leading-5 text-risk">
            <CircleAlert aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            <span>
              {result.insufficientAccount.name} solo tiene{" "}
              <MoneyValue amount={result.insufficientAccount.balance} tone="inherit" className="font-semibold" />.
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}
