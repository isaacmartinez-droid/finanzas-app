"use client";

import { forwardRef } from "react";
import { Calculator } from "lucide-react";
import type { Account, Currency } from "@/types/finance";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { convert, parseAmount } from "@/lib/format";
import type { SimulationDraft, SpendKind } from "@/mocks/simulator";
import { spendKindLabels } from "@/mocks/simulator";
import { MoneyValue } from "./MoneyValue";

export interface SimulationInputProps {
  draft: SimulationDraft;
  onChange: (patch: Partial<SimulationDraft>) => void;
  onSubmit: () => void;
  accounts: Account[];
  exchangeRate: number;
  amountError?: string;
  submitting?: boolean;
  className?: string;
}

/** Currency → amount → concept → account → kind → "Simular impacto". */
export const SimulationInput = forwardRef<HTMLInputElement, SimulationInputProps>(function SimulationInput(
  { draft, onChange, onSubmit, accounts, exchangeRate, amountError, submitting, className },
  amountRef,
) {
  const parsed = parseAmount(draft.amount);
  const other: Currency = draft.currency === "NIO" ? "USD" : "NIO";

  return (
    <form
      noValidate
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex justify-center">
        <SegmentedControl
          disabled={submitting}
          label="Moneda del gasto"
          value={draft.currency}
          onValueChange={(currency) => onChange({ currency })}
          options={[
            { value: "NIO", label: "C$", ariaLabel: "Córdobas" },
            { value: "USD", label: "US$", ariaLabel: "Dólares" },
          ]}
        />
      </div>

      <MoneyInput
        ref={amountRef}
        className="mt-4"
        size="hero"
        label="Monto que deseas gastar"
        currency={draft.currency}
        value={draft.amount}
        onValueChange={(amount) => onChange({ amount })}
        error={amountError}
        disabled={submitting}
        hint={
          parsed ? (
            <MoneyValue amount={convert(parsed, draft.currency, other, exchangeRate)} currency={other} decimals={2} approx tone="inherit" />
          ) : (
            "Escribe cuánto quieres gastar"
          )
        }
      />

      <TextField
        className="mt-4"
        label="Concepto"
        optional
        placeholder="Repuesto o compra eventual"
        value={draft.concept}
        onChange={(e) => onChange({ concept: e.target.value })}
        maxLength={80}
        disabled={submitting}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
        <Select
          label="Cuenta"
          value={draft.accountId}
          onValueChange={(accountId) => onChange({ accountId })}
          options={accounts.filter((a) => a.kind === "operational").map((a) => ({ value: a.id, label: a.name }))}
          disabled={submitting}
        />
        <Select
          label="Tipo de gasto"
          value={draft.kind}
          onValueChange={(kind) => onChange({ kind: kind as SpendKind })}
          options={(Object.keys(spendKindLabels) as SpendKind[]).map((k) => ({ value: k, label: spendKindLabels[k] }))}
          disabled={submitting}
        />
      </div>

      <Button type="submit" fullWidth className="mt-5 min-h-12" loading={submitting}>
        <Calculator aria-hidden size={18} strokeWidth={1.8} />
        Simular impacto
      </Button>
    </form>
  );
});
