"use client";

import { useState } from "react";
import type { Account, CategoryId, Currency } from "@/types/finance";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ChipGroup } from "@/components/ui/Tabs";
import { CATEGORIES } from "@/lib/categories";
import { formatMonthYear } from "@/lib/dates";
import {
  DEFAULT_FILTERS,
  type PeriodFilter,
  type StatusFilter,
  type TransactionFilters,
  type TypeFilter,
} from "./filters";

export interface FiltersSheetProps {
  open: boolean;
  onClose: () => void;
  value: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  accounts: Account[];
  today: string;
  /** Previews how many movements a draft would show. */
  countFor: (filters: TransactionFilters) => number;
}

/** Bottom sheet on phones, right drawer on desktop (spec §45). */
export function FiltersSheet({ open, onClose, value, onApply, accounts, today, countFor }: FiltersSheetProps) {
  const [draft, setDraft] = useState(value);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }
  const set = <K extends keyof TransactionFilters>(key: K, v: TransactionFilters[K]) => setDraft((d) => ({ ...d, [key]: v }));
  const count = countFor(draft);

  const categories: CategoryId[] = ["food", "maintenance", "transport", "health", "services", "leisure", "salary", "family", "savings"];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtros"
      desktop="drawer"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
            Limpiar
          </Button>
          <Button
            className="flex-[2]"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {count === 1 ? "Ver 1 movimiento" : `Ver ${count} movimientos`}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        <ChipGroup<PeriodFilter>
          label="Período"
          value={draft.period}
          onValueChange={(v) => set("period", v)}
          options={[
            { value: "today", label: "Hoy" },
            { value: "week", label: "Esta semana" },
            { value: "month", label: formatMonthYear(today) },
          ]}
        />
        <ChipGroup<TypeFilter>
          label="Tipo"
          value={draft.type}
          onValueChange={(v) => set("type", v)}
          options={[
            { value: "all", label: "Todos" },
            { value: "expense", label: "Gastos" },
            { value: "income", label: "Ingresos" },
            { value: "reserve", label: "Reservas" },
          ]}
        />
        <ChipGroup<CategoryId | "all">
          label="Categoría"
          value={draft.category}
          onValueChange={(v) => set("category", v)}
          options={[{ value: "all", label: "Todas" }, ...categories.map((c) => ({ value: c, label: CATEGORIES[c].label }))]}
        />
        <ChipGroup
          label="Cuenta"
          value={draft.account}
          onValueChange={(v) => set("account", v)}
          options={[{ value: "all", label: "Todas" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
        />
        <ChipGroup<StatusFilter>
          label="Estado"
          value={draft.status}
          onValueChange={(v) => set("status", v)}
          options={[
            { value: "all", label: "Todos" },
            { value: "done", label: "Realizados" },
            { value: "upcoming", label: "Previstos" },
            { value: "omitted", label: "Omitidos" },
          ]}
        />
        <ChipGroup<Currency | "all">
          label="Moneda"
          value={draft.currency}
          onValueChange={(v) => set("currency", v)}
          options={[
            { value: "all", label: "Todas" },
            { value: "NIO", label: "Córdobas (C$)" },
            { value: "USD", label: "Dólares (US$)" },
          ]}
        />
      </div>
    </Sheet>
  );
}
