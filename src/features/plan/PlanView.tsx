"use client";

import { useEffect, useState } from "react";
import { CalendarDays, HandCoins, Lock, Plus, Repeat, Wallet } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { ReserveCard } from "@/components/financial/ReserveCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Tabs } from "@/components/ui/Tabs";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { isUpcoming } from "@/lib/finance";
import { useFinance } from "@/hooks/use-finance";
import { useShell } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";

type PlanTab = "presupuestos" | "reservas" | "recurrencias" | "aportes" | "calendario";

const TABS: { value: PlanTab; label: string }[] = [
  { value: "reservas", label: "Reservas" },
  { value: "recurrencias", label: "Recurrencias" },
  { value: "presupuestos", label: "Presupuestos" },
  { value: "aportes", label: "Aportes" },
  { value: "calendario", label: "Calendario" },
];

/** Plan shell for this phase (spec §62). The simulator deliberately does not live here. */
export function PlanView() {
  const { state, snapshot } = useFinance();
  const { openForm } = useShell();
  const toast = useToast();
  const [tab, setTab] = useState<PlanTab>("reservas");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as PlanTab;
    if (TABS.some((t) => t.value === hash)) setTab(hash);
  }, []);

  // One row per recurring series: its nearest upcoming occurrence, else its latest one.
  const series = new Map<string, Transaction>();
  for (const t of state.transactions) {
    if (!t.recurrence) continue;
    const key = `${t.type}-${t.title}`;
    const current = series.get(key);
    const better =
      !current ||
      (isUpcoming(t) ? !isUpcoming(current) || t.date < current.date : !isUpcoming(current) && t.date > current.date);
    if (better) series.set(key, t);
  }
  const recurring = [...series.values()];

  return (
    <div className="mx-auto max-w-[880px]">
      <p className="mb-3 text-[14px] leading-5 text-ink-2">
        Organiza lo que viene: reservas, pagos que se repiten y metas. Esta sección está en construcción.
      </p>
      <Tabs label="Secciones del plan" controls="plan-panel" items={TABS} value={tab} onValueChange={setTab} />

      <div id="plan-panel" role="tabpanel" aria-label={TABS.find((t) => t.value === tab)?.label} className="mt-4">
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
                {state.reserves.map((r) => (
                  <ReserveCard key={r.id} reserve={r} accountName={state.accounts.find((a) => a.id === r.accountId)?.shortName} />
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
              {recurring.map((t) => {
                const Icon = CATEGORIES[t.categoryId].icon;
                const next = isUpcoming(t) ? t.date : t.recurrence?.nextDate;
                return (
                  <li key={t.id} className="flex items-center gap-3 px-3.5 py-3">
                    <span
                      className={cn(
                        "grid size-[38px] shrink-0 place-items-center rounded-[10px]",
                        t.type === "income" ? "bg-positive-bg text-positive" : "bg-neutral-bg text-neutral",
                      )}
                    >
                      <Icon aria-hidden size={18} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{t.title}</p>
                      <p className="text-[13px] text-ink-2">
                        {t.recurrence?.frequency}
                        {next && ` · próxima ${formatDayMonth(next)}`}
                      </p>
                    </div>
                    <MoneyValue
                      amount={t.type === "expense" ? -t.amount : t.amount}
                      currency={t.currency}
                      sign={t.type === "income" ? "always" : "auto"}
                      tone={t.type === "income" ? "positive" : "default"}
                      className="shrink-0 text-[15px] font-semibold"
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {tab === "presupuestos" && (
          <Card>
            <EmptyState
              icon={Wallet}
              title="Presupuestos por categoría"
              description="Pronto podrás poner un tope a Alimentación, Transporte u Ocio y verlo junto a tu ritmo diario."
            />
            <div className="flex justify-center pb-2">
              <Badge tone="outline">Próximamente</Badge>
            </div>
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
                onClick: () => toast({ title: "Disponible pronto", description: "Los aportes voluntarios llegan en la próxima fase.", tone: "info" }),
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
    </div>
  );
}
