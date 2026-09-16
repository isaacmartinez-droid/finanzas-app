"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Calculator, Lock } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { AvailableMoneyHero } from "@/components/financial/AvailableMoneyHero";
import { DashboardCalculationPreview } from "@/components/financial/DashboardCalculationPreview";
import { FinancialAlert } from "@/components/financial/FinancialAlert";
import { FinancialSummary } from "@/components/financial/FinancialSummary";
import { FinancialTimeline } from "@/components/financial/FinancialTimeline";
import { IncomeAllocationCard } from "@/components/financial/IncomeAllocationCard";
import { QuickActions } from "@/components/financial/QuickActions";
import { SavingsCard } from "@/components/financial/SavingsCard";
import { TransactionItem } from "@/components/financial/TransactionItem";
import { UpcomingIncomeCard } from "@/components/financial/UpcomingIncomeCard";
import { WhatChangedPreview } from "@/components/financial/WhatChangedCard";
import { Card, SectionHeader } from "@/components/ui/Card";
import { AsyncErrorState } from "@/components/ui/AsyncErrorState";
import { EmptyState } from "@/components/ui/Feedback";
import { isUpcoming, lastReceivedIncome, nextIncome, timelineEvents } from "@/lib/finance";
import { toTimelineEntry } from "@/lib/timeline";
import { TransactionDetailSheet } from "@/features/transactions/TransactionDetailSheet";
import { useFinance } from "@/hooks/use-finance";
import { useShell } from "@/hooks/use-shell";
import { DashboardSkeleton } from "./DashboardSkeleton";
import s from "./dashboard.module.css";

export function DashboardView() {
  const { state, snapshot, isLoading, demo, setDemo } = useFinance();
  const { openForm } = useShell();
  const [selected, setSelected] = useState<Transaction | null>(null);

  if (demo.dataError)
    return (
      <AsyncErrorState
        className="mx-auto max-w-[680px]"
        description="No pudimos actualizar tu dinero libre ni los próximos movimientos."
        onRetry={() => setDemo({ dataError: false })}
      />
    );

  if (isLoading) return <DashboardSkeleton />;

  const income = nextIncome(state);
  const receivedIncome = lastReceivedIncome(state);
  const timeline = timelineEvents(state).slice(0, 4).map((t) => toTimelineEntry(t, state));
  const recent = state.transactions
    .filter((t) => !isUpcoming(t))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div className={s.grid}>
      <AvailableMoneyHero
        className={s.hero}
        amount={snapshot.spendableToday}
        status={snapshot.status}
        horizonLabel={`Hasta el próximo ${state.payday.label.toLowerCase()}`}
        horizonDate={state.payday.date}
        daysRemaining={snapshot.daysRemaining}
        shortfall={snapshot.shortfall}
        footer={
          <WhatChangedPreview
            changes={state.changesToday}
            netChange={snapshot.netChange}
            yesterdayFree={snapshot.yesterdayFree}
            free={snapshot.free}
          />
        }
      >
        <FinancialSummary
          items={[
            { id: "operating", label: "Saldo operativo", amount: snapshot.operating, marker: "operating" },
            { id: "reserved", label: "Reservado", amount: snapshot.reserved, marker: "reserved" },
            { id: "committed", label: "Comprometido", amount: snapshot.committed, marker: "committed" },
            { id: "cushion", label: "Colchón", amount: snapshot.cushion, marker: "cushion" },
          ]}
        />
        <DashboardCalculationPreview snapshot={snapshot} className="mt-3" />
      </AvailableMoneyHero>

      <QuickActions
        className={s.actions}
        actions={[
          { id: "spend", label: "Gastar", icon: ArrowUpRight, onClick: () => openForm("expense") },
          { id: "income", label: "Ingresar", icon: ArrowDownLeft, onClick: () => openForm("income") },
          { id: "reserve", label: "Reservar", icon: Lock, onClick: () => openForm("reserve") },
          { id: "simulate", label: "Simular", icon: Calculator, href: "/simulador" },
        ]}
      />

      <FinancialAlert
        className={s.alert}
        snapshot={snapshot}
        paydayDate={state.payday.date}
        comfortDailyTarget={state.comfortDailyTarget}
        detailHref="/hasta-mi-pago"
      />

      {income ? (
        <UpcomingIncomeCard className={s.next} event={income} today={state.today} exchangeRate={state.exchangeRate} />
      ) : (
        <Card className={s.next}>
          <EmptyState
            icon={CalendarClock}
            title="Sin ingresos esperados"
            description="Cuando programes un ingreso aparecerá aquí, sin sumarse a tu dinero libre."
          />
        </Card>
      )}

      {receivedIncome && (
        <IncomeAllocationCard
          className={s.allocation}
          income={receivedIncome}
          exchangeRate={state.exchangeRate}
        />
      )}

      <Card className={s.timeline} aria-labelledby="dash-timeline">
        <SectionHeader id="dash-timeline" title="Próximos eventos" action={{ label: "Ver todo", href: "/hasta-mi-pago" }} />
        <FinancialTimeline
          className="mt-4"
          label="Próximos eventos hasta tu salario"
          entries={timeline}
          today={state.today}
          onSelect={(e) => e.transaction && setSelected(e.transaction)}
        />
      </Card>

      <SavingsCard
        className={s.savings}
        protectedAmount={snapshot.protectedSavings}
        pendingTransfer={snapshot.pendingSavingsTransfer}
        goal={state.savingsGoal}
      />

      <Card padding="none" className={s.recent} aria-labelledby="dash-recent">
        <SectionHeader
          id="dash-recent"
          className="px-3.5 pb-1 pt-3.5"
          title="Movimientos recientes"
          action={{ label: "Ver todos", href: "/movimientos" }}
        />
        <ul className="divide-y divide-line pb-1">
          {recent.map((t) => (
            <li key={t.id}>
              <TransactionItem transaction={t} accounts={state.accounts} today={state.today} onSelect={setSelected} />
            </li>
          ))}
        </ul>
      </Card>

      <TransactionDetailSheet transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
