"use client";

import { useState } from "react";
import { ArrowLeftRight, PiggyBank } from "lucide-react";
import type { Reserve } from "@/types/finance";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { ReserveCard } from "@/components/financial/ReserveCard";
import { SavingsCard } from "@/components/financial/SavingsCard";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { AsyncErrorState } from "@/components/ui/AsyncErrorState";
import { EmptyState } from "@/components/ui/Feedback";
import { savingsAccounts } from "@/lib/finance";
import { useFinance } from "@/hooks/use-finance";
import { useShell } from "@/hooks/use-shell";
import { ReserveDetailSheet } from "@/features/plan/ReserveDetailSheet";

export function SavingsView() {
  const { state, snapshot, demo, setDemo } = useFinance();
  const { openForm } = useShell();
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null);
  const savingReserves = state.reserves.filter((r) => r.purpose === "savings");

  if (demo.dataError)
    return (
      <AsyncErrorState
        className="mx-auto max-w-[680px]"
        description="No pudimos actualizar tus cuentas de ahorro ni tus reservas pendientes."
        onRetry={() => setDemo({ dataError: false })}
      />
    );

  return (
    <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
      <SavingsCard protectedAmount={snapshot.protectedSavings} pendingTransfer={snapshot.pendingSavingsTransfer} goal={state.savingsGoal} />

      <div className="space-y-4">
        <Card aria-labelledby="savings-accounts">
          <SectionHeader id="savings-accounts" title="Dónde está tu ahorro" />
          <ul className="mt-2 divide-y divide-line">
            {savingsAccounts(state.accounts).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-[15px] text-ink">
                  <PiggyBank aria-hidden size={18} strokeWidth={1.8} className="text-saving" />
                  {a.name}
                </span>
                <MoneyValue amount={a.balance} className="font-semibold" />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] leading-5 text-ink-2">Este dinero no forma parte de tu saldo operativo ni del gasto cotidiano.</p>
          <Button variant="secondary" fullWidth className="mt-3" onClick={() => openForm("transfer")}>
            <ArrowLeftRight aria-hidden size={18} strokeWidth={1.8} />
            Transferir a ahorro
          </Button>
        </Card>

        <Card padding="none" aria-labelledby="savings-reserved">
          <SectionHeader id="savings-reserved" title="Reservado para ahorrar" className="px-3.5 pb-1 pt-3.5" />
          {savingReserves.length ? (
            <div className="divide-y divide-line">
              {savingReserves.map((r) => (
                <ReserveCard
                  key={r.id}
                  reserve={r}
                  accountName={state.accounts.find((a) => a.id === r.accountId)?.shortName}
                  onSelect={setSelectedReserve}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PiggyBank}
              title="Nada pendiente de transferir"
              description="Cuando reserves dinero para tu ahorro, aparecerá aquí hasta que lo muevas."
            />
          )}
        </Card>
      </div>
      <ReserveDetailSheet reserve={selectedReserve} onClose={() => setSelectedReserve(null)} />
    </div>
  );
}
