"use client";

import { useId, useRef, useState } from "react";
import { Pencil, Unlock } from "lucide-react";
import type { Reserve } from "@/types/finance";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { formatDayMonth } from "@/lib/dates";
import { formatAmountInput, parseAmount, round2 } from "@/lib/format";
import { operationalAccounts } from "@/lib/finance";
import { useFinance } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";

export interface ReserveDetailSheetProps {
  reserve: Reserve | null;
  onClose: () => void;
}

/** Keeps the selected reserve mounted while the shared sheet animates closed. */
export function ReserveDetailSheet({ reserve, onClose }: ReserveDetailSheetProps) {
  const [last, setLast] = useState<Reserve | null>(reserve);
  if (reserve && reserve.id !== last?.id) setLast(reserve);
  const displayed = reserve ?? last;
  if (!displayed) return null;

  return (
    <ReserveDetailContent
      key={displayed.id}
      seed={displayed}
      open={Boolean(reserve)}
      onClose={onClose}
    />
  );
}

function ReserveDetailContent({ seed, open, onClose }: { seed: Reserve; open: boolean; onClose: () => void }) {
  const { state, snapshot, updateReserve, releaseReserve } = useFinance();
  const toast = useToast();
  const formId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(seed.name);
  const [amount, setAmount] = useState(formatAmountInput(seed.amount));
  const [accountId, setAccountId] = useState(seed.accountId);
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const current = state.reserves.find((item) => item.id === seed.id) ?? seed;
  const parsed = parseAmount(amount) ?? 0;
  const account = state.accounts.find((item) => item.id === current.accountId);
  const editedFree = round2(snapshot.free + current.amount - parsed);

  function startEditing() {
    setName(current.name);
    setAmount(formatAmountInput(current.amount));
    setAccountId(current.accountId);
    setErrors({});
    setSubmitting(false);
    setEditing(true);
  }

  function close() {
    setEditing(false);
    setSubmitting(false);
    onClose();
  }

  function save() {
    if (submitting) return;
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Escribe para qué es la reserva.";
    if (parsed <= 0) next.amount = "Escribe un monto mayor que cero.";
    setErrors(next);
    if (next.amount) {
      amountRef.current?.focus();
      return;
    }
    if (next.name) return;

    setSubmitting(true);
    updateReserve({ id: current.id, name: name.trim(), amount: parsed, accountId });
    toast({
      title: "Reserva actualizada",
      description: (
        <>
          Tu dinero libre queda en <MoneyValue amount={editedFree} tone="inherit" />.
        </>
      ),
    });
    setEditing(false);
    setSubmitting(false);
  }

  function release() {
    if (submitting) return;
    setSubmitting(true);
    releaseReserve(current.id);
    toast({
      title: "Reserva liberada",
      description: (
        <>
          Tu dinero libre sube <MoneyValue amount={current.amount} tone="inherit" />.
        </>
      ),
    });
    close();
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={editing ? "Editar reserva" : "Detalle de la reserva"}
      description={editing ? "Los cambios se mantienen solo durante esta sesión." : "Este dinero sigue en tu cuenta, pero no está libre."}
      footer={
        editing ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={submitting} onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} className="flex-[2]" loading={submitting}>
              Guardar cambios
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" loading={submitting} onClick={release}>
              <Unlock aria-hidden size={17} strokeWidth={1.8} />
              Liberar reserva
            </Button>
            <Button
              className="flex-1"
              onClick={(event) => {
                event.preventDefault();
                startEditing();
              }}
            >
              <Pencil aria-hidden size={17} strokeWidth={1.8} />
              Editar
            </Button>
          </div>
        )
      }
    >
      {editing ? (
        <form
          id={formId}
          className="space-y-4 pt-1"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <TextField
            label="¿Para qué es?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
            disabled={submitting}
            maxLength={80}
          />
          <MoneyInput
            ref={amountRef}
            label="Monto reservado"
            currency="NIO"
            value={amount}
            onValueChange={setAmount}
            error={errors.amount}
            disabled={submitting}
          />
          <Select
            label="Cuenta"
            value={accountId}
            onValueChange={setAccountId}
            options={operationalAccounts(state.accounts).map((item) => ({ value: item.id, label: item.name }))}
            disabled={submitting}
          />
          {parsed > 0 && (
            <p className="rounded-inner bg-info-bg px-3 py-2.5 text-[13px] leading-5 text-ink">
              Con este cambio, tu dinero libre sería <MoneyValue amount={editedFree} decimals={2} tone="inherit" className="font-bold" />.
            </p>
          )}
        </form>
      ) : (
        <>
          <p className="text-[28px] font-[750] leading-9 tracking-[-0.02em]">
            <MoneyValue amount={current.amount} decimals={2} tone="saving" />
          </p>
          <dl className="mt-4 divide-y divide-line text-[14px]">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-2">Propósito</dt>
              <dd className="text-right font-medium text-ink">{current.name}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-2">Cuenta</dt>
              <dd className="text-right font-medium text-ink">{account?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-2">Tipo</dt>
              <dd className="text-right font-medium text-ink">{current.purpose === "savings" ? "Ahorro" : "Gasto"}</dd>
            </div>
            {current.targetDate && (
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-2">Fecha objetivo</dt>
                <dd className="text-right font-medium text-ink">{formatDayMonth(current.targetDate)}</dd>
              </div>
            )}
          </dl>
          {current.note && <p className="mt-3 text-[14px] leading-5 text-ink-2">{current.note}</p>}
          <div className="mt-4 rounded-inner bg-saving-bg px-3 py-2.5 text-[13px] leading-5 text-ink">
            Al liberarla, tu dinero libre subirá <MoneyValue amount={current.amount} tone="inherit" className="font-bold" /> y quedará en{" "}
            <MoneyValue amount={round2(snapshot.free + current.amount)} tone="inherit" className="font-bold" />.
          </div>
        </>
      )}
    </Sheet>
  );
}
