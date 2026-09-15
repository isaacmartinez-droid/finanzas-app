"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, SlidersHorizontal } from "lucide-react";
import type { CategoryId, Currency } from "@/types/finance";
import { DecisionAlternatives } from "@/components/financial/DecisionAlternatives";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { ProtectionList } from "@/components/financial/ProtectionList";
import { SimulationInput } from "@/components/financial/SimulationInput";
import { SimulationResult } from "@/components/financial/SimulationResult";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { parseAmount, toNio } from "@/lib/format";
import { mockSimulationDraft, SIMULATION_LATENCY_MS, type SimulationDraft, type SpendKind } from "@/mocks/simulator";
import { useFinance } from "@/hooks/use-finance";
import { useShell } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";
import { buildAlternatives, detectSpendKind, simulatePurchase, type AlternativeOption } from "./simulate";

interface SimulationRun {
  amount: number;
  currency: Currency;
  accountId: string;
  kind: SpendKind;
  concept: string;
}

const KIND_CATEGORY: Record<SpendKind, CategoryId> = { personal: "other", shared: "leisure", maintenance: "maintenance" };

function toRun(draft: SimulationDraft): SimulationRun | null {
  const amount = parseAmount(draft.amount);
  if (!amount || amount <= 0) return null;
  return { amount, currency: draft.currency, accountId: draft.accountId, kind: draft.kind, concept: draft.concept.trim() };
}

const sameRun = (a: SimulationRun | null, b: SimulationRun | null) =>
  !!a && !!b && a.amount === b.amount && a.currency === b.currency && a.accountId === b.accountId && a.kind === b.kind;

export function SimulatorView() {
  const { state, snapshot, demo } = useFinance();
  const { openForm } = useShell();
  const toast = useToast();
  const amountRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [draft, setDraft] = useState<SimulationDraft>(mockSimulationDraft);
  const [kindTouched, setKindTouched] = useState(false);
  const [amountError, setAmountError] = useState<string>();
  // The mock draft is pre-simulated so the screen opens with an answer.
  const [run, setRun] = useState<SimulationRun | null>(() => toRun(mockSimulationDraft));
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const [altId, setAltId] = useState<string>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function update(patch: Partial<SimulationDraft>) {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (patch.concept !== undefined && !kindTouched) next.kind = detectSpendKind(patch.concept);
      return next;
    });
    if (patch.kind) setKindTouched(true);
    if (patch.amount !== undefined) setAmountError(undefined);
  }

  function simulate() {
    const next = toRun(draft);
    if (!next) {
      setAmountError("Escribe un monto mayor que cero.");
      amountRef.current?.focus();
      return;
    }
    setStatus("loading");
    // On phones the answer sits below the form — bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (demo.simulatorError) {
        setStatus("error");
        return;
      }
      setRun(next);
      setAltId(undefined);
      setStatus("ready");
    }, SIMULATION_LATENCY_MS);
  }

  function tryAnotherAmount() {
    amountRef.current?.focus();
    amountRef.current?.select();
    amountRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const computed = useMemo(() => {
    if (!run) return null;
    const fullNio = toNio(run.amount, run.currency, state.exchangeRate);
    const alternatives = buildAlternatives(run.kind, fullNio, state, snapshot);
    const selectable = alternatives.filter((a) => a.action === "select");
    const selected = selectable.find((a) => a.id === altId) ?? selectable[0];
    const effectiveNio = selected?.amountNio ?? fullNio;
    const factor = fullNio ? effectiveNio / fullNio : 1;
    return {
      alternatives,
      selected,
      effectiveAmount: run.amount * factor,
      result: simulatePurchase(state, snapshot, { amountNio: effectiveNio, accountId: run.accountId }),
    };
  }, [run, altId, state, snapshot]);

  const stale = run && !sameRun(run, toRun(draft));
  const paydayLabel = formatDayMonth(state.payday.date);

  function choose(option: AlternativeOption) {
    if (option.action === "select") setAltId(option.id);
    else if (option.action === "edit") tryAnotherAmount();
    else if (option.action === "postpone") toast({ title: "Compra pospuesta", description: `Te la recordaremos el ${paydayLabel}.`, tone: "info" });
    else if (option.action === "reserve" && run && computed)
      openForm("reserve", { amount: toNio(run.amount, run.currency, state.exchangeRate), title: run.concept || "Compra planificada" });
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 md:mb-6">
        <div>
          <h2 className="text-[20px] font-bold leading-7 text-ink md:text-[22px]">¿Puedo gastar esto?</h2>
          <p className="text-[14px] leading-5 text-ink-2">Simula antes de comprar. Nada se registra hasta que lo confirmes.</p>
        </div>
        <p className="text-[13px] text-ink-2">
          Hoy puedes gastar <MoneyValue amount={snapshot.spendableToday} decimals={2} className="font-semibold" tone="default" />
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
        {/* Left: inputs */}
        <Card padding="hero" className="self-start lg:sticky lg:top-24">
          <SimulationInput
            ref={amountRef}
            draft={draft}
            onChange={update}
            onSubmit={simulate}
            accounts={state.accounts}
            exchangeRate={state.exchangeRate}
            amountError={amountError}
            submitting={status === "loading"}
          />
        </Card>

        {/* Right: result, protections, alternatives, CTAs */}
        <div ref={resultRef} className="min-w-0 scroll-mt-20 space-y-4">
          {run && status === "ready" && (
            <p className={cn("px-1 text-[13px] leading-5", stale ? "font-semibold text-info" : "text-ink-2")}>
              {stale ? (
                "Cambiaste los datos. Toca «Simular impacto» para actualizar el resultado."
              ) : (
                <>
                  Resultado para{" "}
                  <MoneyValue
                    amount={computed?.effectiveAmount ?? run.amount}
                    currency={run.currency}
                    decimals={2}
                    tone="inherit"
                    className="font-semibold text-ink"
                  />
                  {run.concept && ` · ${run.concept}`}
                </>
              )}
            </p>
          )}

          <SimulationResult status={status} result={computed?.result} onRetry={simulate} />

          {status === "ready" && computed && (
            <>
              <Card aria-labelledby="protections-title">
                <SectionHeader id="protections-title" title="Protecciones" />
                <ProtectionList className="mt-2" rows={computed.result.protections} />
              </Card>

              <Card aria-labelledby="alternatives-title">
                <SectionHeader id="alternatives-title" title="Alternativas" />
                <DecisionAlternatives
                  className="mt-1"
                  options={computed.alternatives}
                  selectedId={computed.selected?.id}
                  paydayLabel={paydayLabel}
                  onChoose={choose}
                />
              </Card>

              <div className="space-y-2 pt-1">
                <Button
                  fullWidth
                  className="min-h-12"
                  onClick={() =>
                    openForm("expense", {
                      amount: computed.effectiveAmount,
                      currency: run!.currency,
                      title: run!.concept || "Compra",
                      categoryId: KIND_CATEGORY[run!.kind],
                      accountId: run!.accountId,
                    })
                  }
                >
                  Registrar gasto con este monto
                </Button>
                <Button variant="secondary" fullWidth onClick={tryAnotherAmount}>
                  <PencilLine aria-hidden size={18} strokeWidth={1.8} />
                  Probar con otro monto
                </Button>
                <Link
                  href="/plan#reservas"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold text-primary hover:bg-primary-soft"
                >
                  <SlidersHorizontal aria-hidden size={18} strokeWidth={1.8} />
                  Ajustar reservas antes de comprar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
