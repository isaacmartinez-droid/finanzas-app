"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { AvailableMoneyHero } from "@/components/financial/AvailableMoneyHero";
import { CashFlowBreakdown } from "@/components/financial/CashFlowBreakdown";
import { FinancialTimeline } from "@/components/financial/FinancialTimeline";
import { PaceCard } from "@/components/financial/PaceCard";
import { ProjectionCard } from "@/components/financial/ProjectionCard";
import { WhatChangedCard } from "@/components/financial/WhatChangedCard";
import { Accordion } from "@/components/ui/Accordion";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingRegion, Skeleton } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { daysBetween, formatDayMonth, pluralDays } from "@/lib/dates";
import { isUpcoming } from "@/lib/finance";
import { toTimelineEntry, type TimelineEntry } from "@/lib/timeline";
import { TransactionDetailSheet } from "@/features/transactions/TransactionDetailSheet";
import { useFinance } from "@/hooks/use-finance";
import { BreakdownDetailSheet, type BreakdownId } from "./BreakdownDetailSheet";
import s from "./cash-flow.module.css";

export function CashFlowView() {
  const { state, snapshot, isLoading } = useFinance();
  const [detail, setDetail] = useState<BreakdownId | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);

  if (isLoading) {
    return (
      <LoadingRegion label="Calculando hasta tu pago…" className={s.page}>
        <Skeleton className={cn(s.horizon, "h-[104px] rounded-card")} />
        <Skeleton className={cn(s.free, "h-[150px] rounded-card")} />
        <Skeleton className={cn(s.projection, "h-[190px] rounded-card")} />
        <Skeleton className={cn(s.pace, "h-[120px] rounded-card")} />
        <Skeleton className={cn(s.breakdown, "h-[64px] rounded-card")} />
        <Skeleton className={cn(s.changed, "h-[150px] rounded-card")} />
        <Skeleton className={cn(s.timeline, "h-[320px] rounded-card")} />
      </LoadingRegion>
    );
  }

  const elapsed = daysBetween(state.cycleStart, state.today);
  const cycleProgress = Math.min(1, elapsed / snapshot.cycleDays);

  const now: TimelineEntry = {
    id: "now",
    date: state.today,
    title: "Saldo operativo actual",
    amount: snapshot.operating,
    marker: "now",
  };
  const upcoming = state.transactions
    .filter((t) => isUpcoming(t) && t.date >= state.today && t.date <= state.payday.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => toTimelineEntry(t, state));

  return (
    <div className={s.page}>
      <div className={s.colA}>
        {/* Horizon: until when is this calculated? (spec §36) */}
        <Card className={s.horizon} aria-labelledby="horizon-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="horizon-title" className="text-[15px] font-bold leading-5 text-ink">
                Hasta mi {state.payday.label.toLowerCase()}
              </h2>
              <p className="mt-1 text-[22px] font-bold leading-7 text-ink">{formatDayMonth(state.payday.date)}</p>
              <p className="text-[14px] leading-5 text-ink-2">{pluralDays(snapshot.daysRemaining)} restantes</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
              <Flag aria-hidden size={18} strokeWidth={1.8} />
            </span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-bg"
            role="progressbar"
            aria-label="Avance del periodo de pago"
            aria-valuemin={0}
            aria-valuemax={snapshot.cycleDays}
            aria-valuenow={elapsed}
            aria-valuetext={`Día ${elapsed} de ${snapshot.cycleDays}`}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${cycleProgress * 100}%` }} />
          </div>
          <p className="mt-1.5 flex justify-between text-[12px] text-ink-2">
            <span>Pago anterior · {formatDayMonth(state.cycleStart)}</span>
            <span>
              Día {elapsed} de {snapshot.cycleDays}
            </span>
          </p>
        </Card>

        <WhatChangedCard
          className={s.changed}
          changes={state.changesToday}
          netChange={snapshot.netChange}
          yesterdayFree={snapshot.yesterdayFree}
          free={snapshot.free}
        />
      </div>

      <div className={s.colB}>
        <AvailableMoneyHero
          className={s.free}
          headingId="free-title"
          amount={snapshot.spendableToday}
          status={snapshot.status}
          shortfall={snapshot.shortfall}
          caption="Dinero libre actual. No incluye ingresos esperados."
        />

        <PaceCard
          className={s.pace}
          pace={snapshot.pace}
          free={snapshot.free}
          daysRemaining={snapshot.daysRemaining}
          status={snapshot.status}
        />

        <Card className={s.breakdown}>
          <Accordion title="¿Cómo llegamos a esta cantidad?" headingLevel="h2">
            <CashFlowBreakdown
              className="pb-1 pt-2"
              onSelect={(id) => setDetail(id as BreakdownId)}
              lines={[
                { id: "operating", label: "Saldo operativo", amount: snapshot.operating, hint: "Tus cuentas de uso diario" },
                { id: "reserved", label: "Reservas", amount: -snapshot.reserved, hint: "Dinero con propósito" },
                { id: "committed", label: "Compromisos", amount: -snapshot.committed, hint: "Vencen antes del pago" },
                { id: "cushion", label: "Colchón", amount: -snapshot.cushion, hint: "Mínimo para imprevistos" },
              ]}
              total={{ label: "Dinero libre", amount: snapshot.free }}
            />
          </Accordion>
        </Card>
      </div>

      <div className={s.colC}>
        <ProjectionCard
          className={s.projection}
          amount={snapshot.projection.amount}
          date={snapshot.projection.date}
          lines={snapshot.projection.lines}
        />

        <Card className={s.timeline} aria-labelledby="payday-timeline">
          <SectionHeader id="payday-timeline" title={`Hasta el ${state.payday.label.toLowerCase()}`} />
          <p className="mt-0.5 text-[13px] leading-5 text-ink-2">Los ingresos esperados no cuentan hasta que llegan.</p>
          <FinancialTimeline
            className="mt-4"
            label={`Eventos hasta el ${formatDayMonth(state.payday.date)}`}
            entries={[now, ...upcoming]}
            today={state.today}
            onSelect={(e) => e.transaction && setSelected(e.transaction)}
          />
        </Card>
      </div>

      <BreakdownDetailSheet id={detail} onClose={() => setDetail(null)} />
      <TransactionDetailSheet transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
