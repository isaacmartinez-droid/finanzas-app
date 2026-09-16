"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, HandCoins, Lock, Plus, Repeat, Wallet } from "lucide-react";
import type { Budget, Reserve, Transaction } from "@/types/finance";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { ReserveCard } from "@/components/financial/ReserveCard";
import { AsyncErrorState } from "@/components/ui/AsyncErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Progress } from "@/components/ui/Feedback";
import { Tabs } from "@/components/ui/Tabs";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { budgetSpent, isUpcoming } from "@/lib/finance";
import { useFinance } from "@/hooks/use-finance";
import { useShell } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";
import { BudgetDetailSheet } from "./BudgetDetailSheet";
import { RecurringDetailSheet } from "./RecurringDetailSheet";
import { ReserveDetailSheet } from "./ReserveDetailSheet";

type PlanTab = "presupuestos" | "reservas" | "recurrencias" | "aportes" | "calendario";

const TABS: { value: PlanTab; label: string }[] = [
  { value: "reservas", label: "Reservas" },
  { value: "recurrencias", label: "Recurrencias" },
  { value: "presupuestos", label: "Presupuestos" },
  { value: "aportes", label: "Aportes" },
  { value: "calendario", label: "Calendario" },
];

/** MVP Plan: in-memory budgets, reserves and recurring-series administration. */
export function PlanView() {
  const { state, snapshot, demo, setDemo } = useFinance();
  const { openForm } = useShell();
  const toast = useToast();
  const [tab, setTab] = useState<PlanTab>("reservas");
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null);
  const [selectedRecurring, setSelectedRecurring] = useState<Transaction | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as PlanTab;
    if (TABS.some((item) => item.value === hash)) setTab(hash);
  }, []);

  if (demo.dataError)
    return (
      <AsyncErrorState
        className="mx-auto max-w-[680px]"
        description="No pudimos cargar tus presupuestos, reservas ni recurrencias."
        onRetry={() => setDemo({ dataError: false })}
      />
    );

  // One row per recurring series: its nearest upcoming occurrence, else its latest one.
  const series = new Map<string, Transaction>();
  for (const transaction of state.transactions) {
    if (!transaction.recurrence) continue;
    const key = `${transaction.type}-${transaction.title}`;
    const current = series.get(key);
    const better =
      !current ||
      (isUpcoming(transaction)
        ? !isUpcoming(current) || transaction.date < current.date
        : !isUpcoming(current) && transaction.date > current.date);
    if (better) series.set(key, transaction);
  }
  const recurring = [...series.values()];

  function openNewBudget() {
    setSelectedBudget(null);
    setBudgetOpen(true);
  }

  return (
    <div className="mx-auto max-w-[880px]">
      <p className="mb-3 text-[14px] leading-5 text-ink-2">
        Organiza lo que viene: presupuestos del ciclo, reservas y movimientos que se repiten.
      </p>
      <Tabs label="Secciones del plan" controls="plan-panel" items={TABS} value={tab} onValueChange={setTab} />

      <div id="plan-panel" role="tabpanel" aria-label={TABS.find((item) => item.value === tab)?.label} className="mt-4">
        {tab === "reservas" && (
          <Card padding="none" id="reservas">
            <div className="flex items-center justify-between gap-3 px-3.5 pb-2 pt-3.5">
              <div>
                <h2 className="text-[16px] font-bold text-ink">Reservas activas</h2>
                <p className="text-[13px] text-ink-2">
                  Total reservado <MoneyValue amount={snapshot.reserved} tone="saving" className="font-semibold" />
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openForm("reserve")}>
                <Plus aria-hidden size={16} strokeWidth={2} />
                Reservar
              </Button>
            </div>
            {state.reserves.length ? (
              <div className="divide-y divide-line border-t border-line">
                {state.reserves.map((reserve) => (
                  <ReserveCard
                    key={reserve.id}
                    reserve={reserve}
                    accountName={state.accounts.find((account) => account.id === reserve.accountId)?.shortName}
                    onSelect={setSelectedReserve}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Lock}
                title="Todavía no tienes reservas."
                description="Aparta dinero para algo próximo sin moverlo de tu cuenta."
                action={{ label: "Crear reserva", onClick: () => openForm("reserve") }}
              />
            )}
          </Card>
        )}

        {tab === "recurrencias" && (
          <Card padding="none">
            <h2 className="px-3.5 pb-2 pt-3.5 text-[16px] font-bold text-ink">Se repiten</h2>
            <ul className="divide-y divide-line border-t border-line">
              {recurring.map((transaction) => {
                const Icon = CATEGORIES[transaction.categoryId].icon;
                const next = isUpcoming(transaction) ? transaction.date : transaction.recurrence?.nextDate;
                return (
                  <li key={transaction.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-subtle"
                      onClick={() => setSelectedRecurring(transaction)}
                      aria-label={`Administrar recurrencia ${transaction.title}`}
                    >
                      <span
                        className={cn(
                          "grid size-[38px] shrink-0 place-items-center rounded-[10px]",
                          transaction.type === "income" ? "bg-positive-bg text-positive" : "bg-neutral-bg text-neutral",
                        )}
                      >
                        <Icon aria-hidden size={18} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-semibold text-ink">{transaction.title}</span>
                          {transaction.recurrence?.active === false && <Badge tone="outline">Pausada</Badge>}
                        </span>
                        <span className="block text-[13px] text-ink-2">
                          {transaction.recurrence?.frequency}
                          {next && ` · próxima ${formatDayMonth(next)}`}
                        </span>
                      </span>
                      <MoneyValue
                        amount={transaction.type === "expense" ? -transaction.amount : transaction.amount}
                        currency={transaction.currency}
                        sign={transaction.type === "income" ? "always" : "auto"}
                        tone={transaction.type === "income" ? "positive" : "default"}
                        className="shrink-0 text-[15px] font-semibold"
                      />
                      <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {tab === "presupuestos" && (
          <Card padding="none">
            <div className="flex items-center justify-between gap-3 px-3.5 pb-2 pt-3.5">
              <div>
                <h2 className="text-[16px] font-bold text-ink">Presupuestos del ciclo</h2>
                <p className="text-[13px] text-ink-2">Compara tus gastos sin apartar saldo.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={openNewBudget}>
                <Plus aria-hidden size={16} strokeWidth={2} />
                Crear
              </Button>
            </div>
            {state.budgets.length ? (
              <div className="divide-y divide-line border-t border-line">
                {state.budgets.map((budget) => {
                  const spent = budgetSpent(state, budget);
                  const Icon = CATEGORIES[budget.categoryId].icon;
                  return (
                    <button
                      key={budget.id}
                      type="button"
                      className="block w-full px-3.5 py-3 text-left transition-colors duration-150 hover:bg-subtle"
                      onClick={() => {
                        setSelectedBudget(budget);
                        setBudgetOpen(true);
                      }}
                      aria-label={`Editar presupuesto de ${CATEGORIES[budget.categoryId].label}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
                          <Icon aria-hidden size={18} strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-ink">
                            {CATEGORIES[budget.categoryId].label}
                          </span>
                          <span className={cn("text-[13px]", spent > budget.amount ? "text-risk" : "text-ink-2")}>
                            <MoneyValue amount={spent} tone="inherit" /> de{" "}
                            <MoneyValue amount={budget.amount} tone="inherit" />
                          </span>
                        </span>
                        <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-3" />
                      </span>
                      <Progress
                        className="mt-2.5"
                        label={`Presupuesto de ${CATEGORIES[budget.categoryId].label}`}
                        value={spent}
                        max={budget.amount}
                        valueText={`${spent} de ${budget.amount} córdobas`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="Todavía no tienes presupuestos."
                description="Define un límite por categoría para este ciclo de pago."
                action={{ label: "Crear presupuesto", onClick: openNewBudget }}
              />
            )}
          </Card>
        )}

        {tab === "aportes" && (
          <Card>
            <EmptyState
              icon={HandCoins}
              title="Todavía no tienes aportes voluntarios."
              description="Suma a tu ahorro cuando te sobre algo, sin comprometer tu colchón."
              action={{
                label: "Crear aporte",
                onClick: () =>
                  toast({
                    title: "Disponible pronto",
                    description: "Los aportes voluntarios llegan en la próxima fase.",
                    tone: "info",
                  }),
              }}
            />
          </Card>
        )}

        {tab === "calendario" && (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="Calendario del mes"
              description="Verás tus pagos, ingresos y reservas día por día. Mientras tanto, revisa «Hasta mi pago»."
              action={{ label: "Ir a Hasta mi pago", href: "/hasta-mi-pago" }}
            />
          </Card>
        )}
      </div>

      <p className="mt-4 flex items-center gap-2 px-1 text-[13px] text-ink-2">
        <Repeat aria-hidden size={16} strokeWidth={1.8} />
        Las recurrencias omitidas no se borran: continúan en la siguiente fecha.
      </p>

      <ReserveDetailSheet reserve={selectedReserve} onClose={() => setSelectedReserve(null)} />
      <RecurringDetailSheet transaction={selectedRecurring} onClose={() => setSelectedRecurring(null)} />
      <BudgetDetailSheet
        open={budgetOpen}
        budget={selectedBudget}
        onClose={() => {
          setBudgetOpen(false);
          setSelectedBudget(null);
        }}
      />
    </div>
  );
}
