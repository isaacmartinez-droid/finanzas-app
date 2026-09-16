"use client";

import { useId, useRef, useState } from "react";
import type { CategoryId, Currency } from "@/types/finance";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { TextField } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { ChipGroup } from "@/components/ui/Tabs";
import { CATEGORIES, CATEGORY_OPTIONS } from "@/lib/categories";
import { operationalAccounts } from "@/lib/finance";
import { formatAmountInput, parseAmount, round2, toNio } from "@/lib/format";
import { useFinance } from "@/hooks/use-finance";
import { useShell, type FormMode, type FormPrefill } from "@/hooks/use-shell";
import { useToast } from "@/hooks/use-toast";

const COPY: Record<FormMode, { title: string; description: string; submit: string; toast: string }> = {
  expense: { title: "Registrar gasto", description: "Algo que ya pagaste hoy.", submit: "Registrar gasto", toast: "Gasto registrado" },
  income: { title: "Registrar ingreso", description: "Dinero que ya está en tu cuenta.", submit: "Registrar ingreso", toast: "Ingreso registrado" },
  reserve: {
    title: "Reservar dinero",
    description: "Se queda en tu cuenta, pero deja de contar como dinero libre.",
    submit: "Crear reserva",
    toast: "Reserva creada",
  },
  transfer: { title: "Transferir", description: "Mueve dinero entre tus cuentas.", submit: "Transferir", toast: "Transferencia registrada" },
};

function FormBody({
  mode,
  prefill,
  formId,
  submitting,
  onSubmittingChange,
  onDone,
}: {
  mode: FormMode;
  prefill?: FormPrefill;
  formId: string;
  submitting: boolean;
  onSubmittingChange: (submitting: boolean) => void;
  onDone: () => void;
}) {
  const { state, snapshot, addExpense, addIncome, addReserve, transfer } = useFinance();
  const toast = useToast();
  const amountRef = useRef<HTMLInputElement>(null);

  const opAccounts = operationalAccounts(state.accounts);
  const [currency, setCurrency] = useState<Currency>(prefill?.currency ?? "NIO");
  const [amount, setAmount] = useState(prefill?.amount ? formatAmountInput(prefill.amount) : "");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [categoryId, setCategory] = useState<CategoryId>(
    prefill?.categoryId ?? (mode === "income" ? "salary" : "food"),
  );
  const [accountId, setAccount] = useState(prefill?.accountId ?? opAccounts[0]?.id ?? "");
  const [toId, setToId] = useState(state.accounts.find((a) => a.kind === "savings")?.id ?? "");
  const [errors, setErrors] = useState<{ amount?: string; title?: string }>({});

  const parsed = parseAmount(amount) ?? 0;
  const nio = round2(toNio(parsed, mode === "expense" || mode === "income" ? currency : "NIO", state.exchangeRate));
  const account = state.accounts.find((a) => a.id === accountId);
  const reserveOverdraw = mode === "reserve" && nio > 0 && nio > Math.max(0, snapshot.free);

  function submit() {
    if (submitting) return;
    const next: typeof errors = {};
    if (parsed <= 0) next.amount = "Escribe un monto mayor que cero.";
    else if ((mode === "expense" || mode === "transfer") && account && nio > account.balance)
      next.amount = `Supera el saldo disponible en ${account.name}.`;
    if ((mode === "expense" || mode === "income" || mode === "reserve") && !title.trim())
      next.title = mode === "reserve" ? "Escribe para qué es la reserva." : "Escribe un concepto.";
    setErrors(next);
    if (next.amount) {
      amountRef.current?.focus();
      return;
    }
    if (next.title) return;

    onSubmittingChange(true);
    const clean = title.trim();
    if (mode === "expense") addExpense({ amount: parsed, currency, title: clean, categoryId, accountId });
    if (mode === "income") addIncome({ amount: parsed, currency, title: clean, categoryId, accountId });
    if (mode === "reserve") addReserve({ amount: parsed, name: clean, accountId });
    if (mode === "transfer") transfer({ amount: parsed, fromId: accountId, toId });

    const toKind = state.accounts.find((a) => a.id === toId)?.kind;
    const freeDelta =
      mode === "income"
        ? nio
        : mode === "transfer"
          ? account?.kind === toKind
            ? 0
            : account?.kind === "operational"
              ? -nio
              : nio
          : -nio;
    toast({
      title: COPY[mode].toast,
      description:
        freeDelta === 0 ? (
          "Tu dinero libre no cambia."
        ) : (
          <>
            Tu dinero libre {freeDelta > 0 ? "sube" : "baja"} <MoneyValue amount={Math.abs(freeDelta)} tone="inherit" />.
          </>
        ),
    });
    onDone();
  }

  const accountChips = (mode === "transfer" ? state.accounts : opAccounts).map((a) => ({ value: a.id, label: a.name }));

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5 pt-1"
    >
      {(mode === "expense" || mode === "income") && (
        <SegmentedControl
          disabled={submitting}
          label="Moneda"
          value={currency}
          onValueChange={setCurrency}
          options={[
            { value: "NIO", label: "C$", ariaLabel: "Córdobas" },
            { value: "USD", label: "US$", ariaLabel: "Dólares" },
          ]}
        />
      )}

      <MoneyInput
        ref={amountRef}
        label="Monto"
        currency={mode === "expense" || mode === "income" ? currency : "NIO"}
        value={amount}
        onValueChange={setAmount}
        error={errors.amount}
        disabled={submitting}
        hint={
          currency === "USD" && parsed > 0 && (mode === "expense" || mode === "income") ? (
            <MoneyValue amount={nio} approx tone="inherit" decimals={2} />
          ) : account && mode !== "income" ? (
            <>
              Disponible en {account.shortName}: <MoneyValue amount={account.balance} tone="inherit" />
            </>
          ) : undefined
        }
      />

      {reserveOverdraw && (
        <Alert tone="warning" title="Esta reserva supera tu dinero libre">
          Puedes crearla, pero tu estado pasará a <strong className="font-semibold text-ink">En riesgo</strong> porque
          tocarías el colchón.
        </Alert>
      )}

      {mode !== "transfer" && (
        <TextField
          label={mode === "reserve" ? "¿Para qué es?" : "Concepto"}
          placeholder={mode === "reserve" ? "Ej. Regalo de cumpleaños" : mode === "income" ? "Ej. Venta de accesorio" : "Ej. Almuerzo"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          maxLength={80}
          disabled={submitting}
        />
      )}

      {(mode === "expense" || mode === "income") && (
        <ChipGroup
          label="Categoría"
          value={categoryId}
          onValueChange={setCategory}
          disabled={submitting}
          options={CATEGORY_OPTIONS[mode].map((id) => ({ value: id, label: CATEGORIES[id].label }))}
        />
      )}

      <ChipGroup
        label={mode === "transfer" ? "Desde" : mode === "income" ? "Entró a" : "Cuenta"}
        value={accountId}
        onValueChange={(id) => {
          setAccount(id);
          if (id === toId) setToId(state.accounts.find((a) => a.id !== id)?.id ?? "");
        }}
        disabled={submitting}
        options={accountChips}
      />

      {mode === "transfer" && (
        <ChipGroup
          label="Hacia"
          value={toId}
          onValueChange={setToId}
          disabled={submitting}
          options={state.accounts.filter((a) => a.id !== accountId).map((a) => ({ value: a.id, label: a.name }))}
        />
      )}
    </form>
  );
}

/** One sheet for the four quick-add forms. Data lives in memory only. */
export function TransactionFormSheet() {
  const { form, closeForm } = useShell();
  const formId = useId();
  const [lastMode, setLastMode] = useState<FormMode>("expense");
  const [instance, setInstance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [prevForm, setPrevForm] = useState(form);

  // Keep the last mode while the sheet animates out; remount fields on every open.
  if (form !== prevForm) {
    setPrevForm(form);
    if (form) {
      setLastMode(form.mode);
      setInstance((n) => n + 1);
      setSubmitting(false);
    }
  }

  const mode = form?.mode ?? lastMode;
  const copy = COPY[mode];

  return (
    <Sheet
      open={Boolean(form)}
      onClose={closeForm}
      title={copy.title}
      description={copy.description}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={closeForm} className="flex-1" disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} className="flex-[2]" loading={submitting}>
            {copy.submit}
          </Button>
        </div>
      }
    >
      <FormBody
        key={instance}
        mode={mode}
        prefill={form?.prefill}
        formId={formId}
        submitting={submitting}
        onSubmittingChange={setSubmitting}
        onDone={closeForm}
      />
    </Sheet>
  );
}
