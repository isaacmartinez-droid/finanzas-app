"use client";

import { useEffect, useId, useState } from "react";
import { CirclePause, CirclePlay } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORIES, TYPE_LABEL } from "@/lib/categories";
import { formatDayMonth } from "@/lib/dates";
import { useFinance } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";

const FREQUENCIES = ["Semanal", "Quincenal", "Mensual"] as const;
type Frequency = (typeof FREQUENCIES)[number];

export function RecurringDetailSheet({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  const { state, updateRecurrence } = useFinance();
  const toast = useToast();
  const formId = useId();
  const [last, setLast] = useState<Transaction | null>(transaction);
  const [frequency, setFrequency] = useState<Frequency>(transaction?.recurrence?.frequency ?? "Mensual");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!transaction?.recurrence) return;
    setLast(transaction);
    setFrequency(transaction.recurrence.frequency);
    setSubmitting(false);
  }, [transaction]);

  const displayed = transaction ?? last;
  const current = displayed ? (state.transactions.find((item) => item.id === displayed.id) ?? displayed) : null;
  if (!current?.recurrence) return null;
  const activeTransaction = current;

  const active = activeTransaction.recurrence!.active !== false;
  const nextDate =
    activeTransaction.status === "expected" || activeTransaction.status === "scheduled"
      ? activeTransaction.date
      : activeTransaction.recurrence!.nextDate;

  function save() {
    if (submitting) return;
    setSubmitting(true);
    updateRecurrence({ transactionId: activeTransaction.id, frequency, active });
    toast({ title: "Recurrencia actualizada", description: `Ahora se repite de forma ${frequency.toLowerCase()}.` });
    onClose();
  }

  function toggleActive() {
    if (submitting) return;
    setSubmitting(true);
    updateRecurrence({ transactionId: activeTransaction.id, frequency, active: !active });
    toast({
      title: active ? "Recurrencia pausada" : "Recurrencia reanudada",
      description: active
        ? "Sus próximas ocurrencias salieron de la proyección."
        : "Sus próximas ocurrencias vuelven a la proyección.",
    });
    onClose();
  }

  return (
    <Sheet
      open={Boolean(transaction)}
      onClose={onClose}
      title="Administrar recurrencia"
      description="Los cambios se mantienen solo durante esta sesión."
      footer={
        <Button type="submit" form={formId} fullWidth loading={submitting}>
          Guardar frecuencia
        </Button>
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-6 text-ink">{current.title}</p>
          <p className="mt-0.5 text-[13px] text-ink-2">
            {TYPE_LABEL[current.type]} · {CATEGORIES[current.categoryId].label}
          </p>
        </div>
        <Badge tone={active ? "positive" : "outline"}>{active ? "Activa" : "Pausada"}</Badge>
      </div>
      <p className="mt-3 text-[26px] font-bold leading-8">
        <MoneyValue
          amount={current.type === "expense" ? -current.amount : current.amount}
          currency={current.currency}
          sign={current.type === "income" ? "always" : "auto"}
          tone={current.type === "income" ? "positive" : "default"}
        />
      </p>
      {nextDate && <p className="mt-1 text-[13px] text-ink-2">Próxima fecha: {formatDayMonth(nextDate)}</p>}

      <form
        id={formId}
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Select
          label="Frecuencia"
          value={frequency}
          onValueChange={(value) => setFrequency(value as Frequency)}
          options={FREQUENCIES.map((value) => ({ value, label: value }))}
          disabled={submitting}
        />
        <Button type="button" variant="secondary" fullWidth loading={submitting} onClick={toggleActive}>
          {active ? <CirclePause aria-hidden size={18} strokeWidth={1.8} /> : <CirclePlay aria-hidden size={18} strokeWidth={1.8} />}
          {active ? "Pausar recurrencia" : "Reanudar recurrencia"}
        </Button>
      </form>
    </Sheet>
  );
}
