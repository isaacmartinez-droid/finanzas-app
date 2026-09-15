"use client";

import { useState } from "react";
import { CircleCheck, CirclePause } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { TransactionStatusBadge } from "@/components/financial/FinancialStatusBadge";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORIES, TYPE_LABEL } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatLongDate } from "@/lib/dates";
import { toNio } from "@/lib/format";
import { transactionVisual } from "@/lib/transaction-display";
import { useFinance } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";

const EXPLAIN: Partial<Record<Transaction["status"], string>> = {
  expected: "Forma parte de tu proyección, pero no aumenta tu dinero libre hasta que lo recibas.",
  scheduled: "Está programado. Se descontará cuando ocurra.",
  omitted: "No ocurrió y no afecta tu saldo. La recurrencia continúa.",
  reserved: "El dinero sigue en tu cuenta, pero ya tiene un propósito y no cuenta como dinero libre.",
};

/** Full detail — long titles shown complete here (spec §84). */
export function TransactionDetailSheet({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  const { state, markReceived, omitOccurrence } = useFinance();
  const toast = useToast();
  // Keep the last transaction while the sheet animates out.
  const [last, setLast] = useState<Transaction | null>(transaction);
  if (transaction && transaction !== last) setLast(transaction);
  const t = transaction ?? last;

  const live = t ? (state.transactions.find((x) => x.id === t.id) ?? t) : null;
  if (!live) return null;

  const v = transactionVisual(live);
  const Icon = v.icon;
  const account = state.accounts.find((a) => a.id === live.accountId);
  const toAccount = state.accounts.find((a) => a.id === live.toAccountId);
  const canReceive = live.type === "income" && live.status === "expected";
  const canOmit = live.type === "expense" && live.status === "scheduled" && Boolean(live.recurrence);

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Fecha", value: formatLongDate(live.date) },
    { label: "Tipo", value: TYPE_LABEL[live.type] },
    { label: "Categoría", value: CATEGORIES[live.categoryId].label },
    { label: live.type === "transfer" ? "Desde" : "Cuenta", value: account?.name ?? "—" },
    ...(toAccount ? [{ label: "Hacia", value: toAccount.name }] : []),
    ...(live.recurrence ? [{ label: "Recurrencia", value: live.recurrence.frequency }] : []),
  ];

  return (
    <Sheet
      open={Boolean(transaction)}
      onClose={onClose}
      title="Detalle del movimiento"
      footer={
        canReceive || canOmit ? (
          <div className="flex gap-2">
            {canReceive && (
              <Button
                fullWidth
                onClick={() => {
                  markReceived(live.id);
                  toast({ title: "Ingreso recibido", description: "Ya forma parte de tu dinero libre." });
                  onClose();
                }}
              >
                <CircleCheck aria-hidden size={18} strokeWidth={1.8} />
                Marcar como recibido
              </Button>
            )}
            {canOmit && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  omitOccurrence(live.id);
                  toast({ title: "Movimiento omitido", description: "La recurrencia continúa la próxima vez." });
                  onClose();
                }}
              >
                <CirclePause aria-hidden size={18} strokeWidth={1.8} />
                Omitir esta vez
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-[12px]", v.boxClass)}>
          <Icon aria-hidden size={20} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold leading-6 text-ink [overflow-wrap:anywhere]">{live.title}</p>
          <div className="mt-1.5">
            <TransactionStatusBadge status={live.status} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-[28px] font-[750] leading-9 tracking-[-0.02em]">
        <MoneyValue amount={v.amount} currency={live.currency} sign={v.sign} tone={v.tone} strike={v.strike} decimals={2} />
      </p>
      {live.currency === "USD" && (
        <p className="text-[14px] text-ink-2">
          <MoneyValue amount={toNio(live.amount, "USD", state.exchangeRate)} decimals={2} approx tone="inherit" /> al tipo de
          cambio de {state.exchangeRate}
        </p>
      )}

      {EXPLAIN[live.status] && (
        <p className="mt-3 rounded-inner bg-info-bg px-3 py-2.5 text-[14px] leading-5 text-ink">{EXPLAIN[live.status]}</p>
      )}

      {live.breakdown && (
        <dl className="mt-4 space-y-1.5 rounded-inner border border-line p-3 text-[14px]">
          {live.breakdown.map((l) => (
            <div key={l.label} className="flex justify-between gap-3">
              <dt className="text-ink-2">{l.label}</dt>
              <dd>
                <MoneyValue amount={l.amount} currency={live.currency} />
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-line pt-2 font-semibold">
            <dt>Neto</dt>
            <dd>
              <MoneyValue amount={live.amount} currency={live.currency} />
            </dd>
          </div>
        </dl>
      )}

      <dl className="mt-4 divide-y divide-line text-[14px]">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4 py-2.5">
            <dt className="text-ink-2">{r.label}</dt>
            <dd className="text-right font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>

      {live.note && <p className="mt-3 text-[14px] leading-5 text-ink-2">{live.note}</p>}
    </Sheet>
  );
}
