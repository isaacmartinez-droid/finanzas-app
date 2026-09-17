"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Landmark, Pencil, PiggyBank, Plus, WalletCards } from "lucide-react";
import { AsyncErrorState } from "@/components/ui/AsyncErrorState";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Input";
import { LoadingRegion, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/hooks/use-toast";
import { moneyInputToApiDecimal } from "@/lib/money-input-boundary";
import { IconButton } from "@/components/ui/IconButton";
import { AccountNameSheet } from "./AccountNameSheet";

type Currency = "NIO" | "USD";
type AccountKind = "operational" | "savings";

export interface PersistedAccount {
  id: string;
  name: string;
  kind: AccountKind;
  currency: Currency;
  currentBalance: string;
}

interface AccountFormState {
  name: string;
  kind: AccountKind;
  currency: Currency;
  openingBalance: string;
  exchangeRate: string;
}

interface AccountsResponse {
  accounts?: PersistedAccount[];
  account?: PersistedAccount;
  error?: string;
}

const initialForm: AccountFormState = {
  name: "",
  kind: "operational",
  currency: "NIO",
  openingBalance: "",
  exchangeRate: "",
};

/** First persisted screen: it intentionally avoids mixing live accounts with mock financial totals. */
export function PersistedAccountsDashboard() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<PersistedAccount[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PersistedAccount | null>(null);

  async function loadAccounts() {
    setLoadError(null);
    try {
      const response = await fetch("/api/accounts", { cache: "no-store" });
      const body = await readAccountsResponse(response);
      if (!response.ok || !body.accounts) throw new Error(body.error ?? "No pudimos cargar tus cuentas.");
      setAccounts(body.accounts);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No pudimos cargar tus cuentas.");
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  function updateForm<Key extends keyof AccountFormState>(key: Key, value: AccountFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.openingBalance.trim() || (form.currency === "USD" && !form.exchangeRate.trim())) {
      setFormError("Completa el nombre, el saldo inicial y la tasa si la cuenta está en USD.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          kind: form.kind,
          currency: form.currency,
          openingBalance: moneyInputToApiDecimal(form.openingBalance),
          ...(form.currency === "USD" ? { exchangeRate: form.exchangeRate } : {}),
        }),
      });
      const body = await readAccountsResponse(response);
      if (!response.ok || !body.account) throw new Error(body.error ?? "No pudimos crear la cuenta.");

      setAccounts((current) => [...(current ?? []), body.account as PersistedAccount]);
      setForm(initialForm);
      setShowForm(false);
      toast({ title: "Cuenta creada", description: `${body.account.name} ya está lista para registrar movimientos.` });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No pudimos crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <AsyncErrorState description={loadError} onRetry={() => void loadAccounts()} className="mx-auto max-w-[680px]" />;
  }

  if (!accounts) {
    return (
      <LoadingRegion label="Cargando cuentas" className="mx-auto max-w-[680px] space-y-3">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-52 w-full" />
      </LoadingRegion>
    );
  }

  const isFirstAccount = accounts.length === 0;
  return (
    <div className="mx-auto max-w-[760px] py-2 md:py-5">
      <div className="max-w-[60ch]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-primary">Datos reales</p>
        <h2 className="mt-1 text-[24px] font-bold leading-8 text-ink md:text-[28px]">{isFirstAccount ? "Crea tu primera cuenta" : "Tus cuentas"}</h2>
        <p className="mt-2 text-[15px] leading-6 text-ink-2">
          {isFirstAccount
            ? "Registra dónde está tu dinero hoy. El saldo inicial no crea un movimiento; establece el punto de partida del ledger."
            : "Estos saldos provienen de PostgreSQL. El dashboard financiero completo se habilitará al conectar movimientos y protecciones."}
        </p>
      </div>

      {!isFirstAccount && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {accounts.map((account) => {
            const Icon = account.kind === "savings" ? PiggyBank : Landmark;
            return (
              <Card key={account.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
                    <Icon aria-hidden size={20} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1">
                      <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{account.name}</p>
                      <IconButton icon={Pencil} label={`Editar ${account.name}`} onClick={() => setEditingAccount(account)} className="-mt-2 -mr-2" />
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-2">{account.kind === "savings" ? "Ahorro protegido" : "Cuenta operativa"}</p>
                    <p className="money mt-3 text-[20px] font-bold text-ink">{formatMoney(account.currency, account.currentBalance)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(!isFirstAccount && !showForm) && (
        <Button className="mt-5" variant="secondary" onClick={() => setShowForm(true)}>
          <Plus aria-hidden size={18} strokeWidth={1.8} />
          Agregar cuenta
        </Button>
      )}

      {(isFirstAccount || showForm) && (
        <form className="mt-6" onSubmit={createAccount}>
          <Card>
            <SectionHeader title={isFirstAccount ? "Información de la cuenta" : "Nueva cuenta"} as="h3" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Ej. Cuenta principal"
                autoComplete="off"
                disabled={submitting}
                className="sm:col-span-2"
              />
              <Select
                label="Tipo"
                value={form.kind}
                onValueChange={(value) => updateForm("kind", value as AccountKind)}
                options={[
                  { value: "operational", label: "Operativa" },
                  { value: "savings", label: "Ahorro" },
                ]}
                disabled={submitting}
              />
              <Select
                label="Moneda"
                value={form.currency}
                onValueChange={(value) => updateForm("currency", value as Currency)}
                options={[
                  { value: "NIO", label: "Córdoba (NIO)" },
                  { value: "USD", label: "Dólar (USD)" },
                ]}
                disabled={submitting}
              />
              <MoneyInput
                label="Saldo inicial"
                value={form.openingBalance}
                onValueChange={(value) => updateForm("openingBalance", value)}
                currency={form.currency}
                disabled={submitting}
                hint="El saldo que tienes hoy en esta cuenta."
              />
              {form.currency === "USD" && (
                <TextField
                  label="Tasa de cambio"
                  value={form.exchangeRate}
                  onChange={(event) => updateForm("exchangeRate", event.target.value)}
                  inputMode="decimal"
                  placeholder="Ej. 36.6243"
                  hint="Córdobas por US$1."
                  disabled={submitting}
                />
              )}
            </div>
            {formError && (
              <p role="alert" className="mt-4 flex items-start gap-1.5 text-[13px] leading-5 text-risk">
                <CircleAlert aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                {formError}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" loading={submitting} loadingLabel="Creando cuenta">
                <WalletCards aria-hidden size={18} strokeWidth={1.8} />
                Crear cuenta
              </Button>
              {!isFirstAccount && (
                <Button type="button" variant="secondary" disabled={submitting} onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </Card>
        </form>
      )}
      <AccountNameSheet
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onSaved={(updated) => {
          setAccounts((current) => current?.map((account) => (account.id === updated.id ? updated : account)) ?? null);
          toast({ title: "Cuenta actualizada", description: "El nombre de la cuenta fue corregido." });
        }}
      />
    </div>
  );
}

function formatMoney(currency: Currency, amount: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount);
  if (!match) return amount;
  const [, sign, whole, fraction = ""] = match;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = currency === "NIO" ? "C$" : "US$";
  return `${sign}${symbol}${grouped}.${fraction.padEnd(2, "0")}`;
}

async function readAccountsResponse(response: Response): Promise<AccountsResponse> {
  const payload = await response.text();
  if (!payload) return {};

  try {
    return JSON.parse(payload) as AccountsResponse;
  } catch {
    return { error: `El servidor respondió con un formato inesperado (${response.status}).` };
  }
}
