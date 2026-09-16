"use client";

import { useMemo, useState } from "react";
import { Lightbulb, SearchX, SlidersHorizontal } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { TransactionItem } from "@/components/financial/TransactionItem";
import { TransactionTable, type TransactionSection } from "@/components/financial/TransactionTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AsyncErrorState } from "@/components/ui/AsyncErrorState";
import { Alert, EmptyState, LoadingRegion, Skeleton } from "@/components/ui/Feedback";
import { SearchInput } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { useFinance } from "@/hooks/use-finance";
import { FiltersSheet } from "./FiltersSheet";
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  filterTransactions,
  groupTransactions,
  type TransactionFilters,
  type TypeFilter,
} from "./filters";
import { TransactionDetailSheet } from "./TransactionDetailSheet";

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
  { value: "reserve", label: "Reservas" },
];

const SECTION_META = {
  today: { label: "Hoy", hint: undefined },
  upcoming: { label: "Próximos", hint: "Previstos: todavía no afectan tu saldo" },
  past: { label: "Anteriores", hint: undefined },
} as const;

export function TransactionsView() {
  const { state, isLoading, demo, setDemo } = useFinance();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const results = useMemo(
    () => filterTransactions(state.transactions, filters, query, state.accounts, state.today),
    [state.transactions, state.accounts, state.today, filters, query],
  );
  const groups = groupTransactions(results, state.today);
  const sections: TransactionSection[] = (["today", "upcoming", "past"] as const)
    .map((id) => ({ id, label: SECTION_META[id].label, items: groups[id] }))
    .filter((sct) => sct.items.length > 0);
  const filterCount = activeFilterCount(filters);

  if (demo.dataError)
    return (
      <AsyncErrorState
        className="mx-auto max-w-[680px]"
        description="No pudimos cargar tus movimientos. Tu búsqueda y tus filtros siguen aquí."
        onRetry={() => setDemo({ dataError: false })}
      />
    );

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Search · filters · type tabs */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex gap-2 lg:contents">
          <SearchInput
            label="Buscar movimientos"
            placeholder="Buscar movimientos..."
            value={query}
            onValueChange={setQuery}
            className="min-w-0 flex-1 lg:order-1 lg:max-w-sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            className={cn("shrink-0 lg:order-3 lg:ml-auto", filterCount > 0 && "border-primary text-primary")}
          >
            <SlidersHorizontal aria-hidden size={18} strokeWidth={1.8} />
            Filtros{filterCount > 0 && ` (${filterCount})`}
          </Button>
        </div>
        <Tabs
          className="lg:order-2"
          label="Tipo de movimiento"
          controls="transactions-results"
          items={TYPE_TABS}
          value={filters.type}
          onValueChange={(type) => setFilters((f) => ({ ...f, type }))}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {results.length === 1 ? "1 movimiento" : `${results.length} movimientos`}
      </p>

      <div id="transactions-results" role="tabpanel" className="mt-4">
        {isLoading ? (
          <LoadingRegion label="Cargando movimientos…">
            <Card padding="none" className="divide-y divide-line">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex gap-3 px-3.5 py-3">
                  <Skeleton className="size-[38px] rounded-[10px]" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                </div>
              ))}
            </Card>
          </LoadingRegion>
        ) : sections.length === 0 ? (
          <Card>
            <EmptyState
              icon={SearchX}
              title="No encontramos movimientos"
              description="Prueba con otra palabra o quita algunos filtros."
              action={{
                label: "Limpiar búsqueda y filtros",
                onClick: () => {
                  setQuery("");
                  setFilters(DEFAULT_FILTERS);
                },
              }}
            />
          </Card>
        ) : (
          <>
            {/* Phones & tablets: grouped list */}
            <div className="space-y-5 lg:hidden">
              {sections.map((section) => {
                const meta = SECTION_META[section.id as keyof typeof SECTION_META];
                return (
                  <section key={section.id} aria-labelledby={`sec-${section.id}`}>
                    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                      <h2 id={`sec-${section.id}`} className="text-[15px] font-bold text-ink">
                        {section.label} <span className="font-medium text-ink-2">· {section.items.length}</span>
                      </h2>
                      {meta.hint && <p className="truncate text-[12px] text-ink-2">{meta.hint}</p>}
                    </div>
                    <Card padding="none" className={cn("overflow-hidden", section.id === "upcoming" && "border-dashed border-line-strong")}>
                      <ul className="divide-y divide-line">
                        {section.items.map((t) => (
                          <li key={t.id}>
                            <TransactionItem
                              transaction={t}
                              accounts={state.accounts}
                              today={state.today}
                              showDate={section.id !== "today"}
                              onSelect={setSelected}
                            />
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </section>
                );
              })}
            </div>

            {/* Desktop: table */}
            <Card padding="none" className="hidden overflow-hidden lg:block">
              <TransactionTable sections={sections} accounts={state.accounts} today={state.today} onSelect={setSelected} />
            </Card>
          </>
        )}
      </div>

      <Alert tone="info" icon={Lightbulb} title="Consejo de flujo" className="mt-6">
        Los movimientos esperados forman parte de tu proyección, pero no aumentan tu dinero disponible actual.
      </Alert>

      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onApply={setFilters}
        accounts={state.accounts}
        today={state.today}
        countFor={(f) => filterTransactions(state.transactions, f, query, state.accounts, state.today).length}
      />
      <TransactionDetailSheet transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
