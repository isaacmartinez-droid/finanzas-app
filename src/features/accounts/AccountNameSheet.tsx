"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import type { PersistedAccount } from "./PersistedAccountsDashboard";

interface AccountNameSheetProps {
  account: PersistedAccount | null;
  onClose: () => void;
  onSaved: (account: PersistedAccount) => void;
}

/** Rename only: amounts and account classification remain immutable after opening. */
export function AccountNameSheet({ account, onClose, onSaved }: AccountNameSheetProps) {
  const [last, setLast] = useState<PersistedAccount | null>(account);
  if (account && account.id !== last?.id) setLast(account);
  const displayed = account ?? last;
  if (!displayed) return null;

  return <AccountNameContent key={displayed.id} account={displayed} open={Boolean(account)} onClose={onClose} onSaved={onSaved} />;
}

function AccountNameContent({
  account,
  open,
  onClose,
  onSaved,
}: {
  account: PersistedAccount;
  open: boolean;
  onClose: () => void;
  onSaved: (account: PersistedAccount) => void;
}) {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(account.name);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Escribe un nombre para la cuenta.");
      nameRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await readAccountResponse(response);
      if (!response.ok || !body.account) throw new Error(body.error ?? "No pudimos actualizar la cuenta.");
      onSaved(body.account);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Editar cuenta"
      description="Puedes corregir su nombre. El saldo, tipo y moneda se conservan."
      initialFocusRef={nameRef}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled={submitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} className="flex-[2]" loading={submitting}>
            Guardar cambios
          </Button>
        </div>
      }
    >
      <form id={formId} className="pt-1" noValidate onSubmit={save}>
        <TextField
          ref={nameRef}
          label="Nombre"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          error={error}
          disabled={submitting}
          autoComplete="off"
          maxLength={120}
        />
      </form>
    </Sheet>
  );
}

async function readAccountResponse(response: Response): Promise<{ account?: PersistedAccount; error?: string }> {
  const payload = await response.text();
  if (!payload) return {};
  try {
    return JSON.parse(payload) as { account?: PersistedAccount; error?: string };
  } catch {
    return { error: `El servidor respondió con un formato inesperado (${response.status}).` };
  }
}
