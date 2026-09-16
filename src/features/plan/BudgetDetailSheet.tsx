"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Budget, CategoryId } from "@/types/finance";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORIES, CATEGORY_OPTIONS } from "@/lib/categories";
import { formatAmountInput, parseAmount } from "@/lib/format";
import { useFinance } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";

export interface BudgetDetailSheetProps {
  open: boolean;
  budget: Budget | null;
  onClose: () => void;
}

/** Create/edit/delete a cycle budget in the current in-memory finance state. */
export function BudgetDetailSheet({ open, budget, onClose }: BudgetDetailSheetProps) {
  const { state, addBudget, updateBudget, deleteBudget } = useFinance();
  const toast = useToast();
  const formId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState<CategoryId>(budget?.categoryId ?? "food");
  const [amount, setAmount] = useState(budget ? formatAmountInput(budget.amount) : "");
  const [error, setError] = useState<string>();
  const [categoryError, setCategoryError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategoryId(budget?.categoryId ?? "food");
    setAmount(budget ? formatAmountInput(budget.amount) : "");
    setError(undefined);
    setCategoryError(undefined);
    setSubmitting(false);
  }, [open, budget]);

  const parsed = parseAmount(amount) ?? 0;

  function save() {
    if (submitting) return;
    const duplicate = state.budgets.some((item) => item.categoryId === categoryId && item.id !== budget?.id);
    setError(parsed > 0 ? undefined : "Escribe un límite mayor que cero.");
    setCategoryError(duplicate ? "Ya existe un presupuesto para esta categoría." : undefined);
    if (parsed <= 0) {
      amountRef.current?.focus();
      return;
    }
    if (duplicate) return;

    setSubmitting(true);
    if (budget) updateBudget(budget.id, { categoryId, amount: parsed });
    else addBudget({ categoryId, amount: parsed });
    toast({
      title: budget ? "Presupuesto actualizado" : "Presupuesto creado",
      description: "El límite organiza tus gastos y no aparta dinero de tu saldo.",
    });
    onClose();
  }

  function remove() {
    if (!budget || submitting) return;
    setSubmitting(true);
    deleteBudget(budget.id);
    toast({ title: "Presupuesto eliminado", description: "Tus movimientos y tu dinero libre no cambiaron." });
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={budget ? "Editar presupuesto" : "Crear presupuesto"}
      description="Define un límite por categoría para el ciclo de pago actual."
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled={submitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} className="flex-[2]" loading={submitting}>
            {budget ? "Guardar cambios" : "Crear presupuesto"}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="space-y-4 pt-1"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Select
          label="Categoría"
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value as CategoryId);
            setCategoryError(undefined);
          }}
          options={CATEGORY_OPTIONS.expense.map((id) => ({ value: id, label: CATEGORIES[id].label }))}
          error={categoryError}
          disabled={submitting}
        />
        <MoneyInput
          ref={amountRef}
          label="Límite del ciclo"
          currency="NIO"
          value={amount}
          onValueChange={setAmount}
          error={error}
          disabled={submitting}
        />
        <p className="rounded-inner bg-info-bg px-3 py-2.5 text-[13px] leading-5 text-ink">
          Un presupuesto sirve para comparar lo gastado. No crea una reserva ni cambia tu dinero libre.
        </p>
        {budget && (
          <Button type="button" variant="tertiary" fullWidth disabled={submitting} onClick={remove}>
            <Trash2 aria-hidden size={17} strokeWidth={1.8} />
            Eliminar presupuesto
          </Button>
        )}
      </form>
    </Sheet>
  );
}
