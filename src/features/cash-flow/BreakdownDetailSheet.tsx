"use client";

import { useState } from "react";
import { Landmark, Lock } from "lucide-react";
import { MoneyValue } from "@/components/financial/MoneyValue";
import { ReserveCard } from "@/components/financial/ReserveCard";
import { EmptyState } from "@/components/ui/Feedback";
import { Sheet } from "@/components/ui/Sheet";
import { formatDayMonth } from "@/lib/dates";
import { operationalAccounts } from "@/lib/finance";
import { useFinance } from "@/hooks/use-finance";
import { useShell } from "@/hooks/use-shell";

export type BreakdownId = "operating" | "reserved" | "committed" | "cushion";

const TITLES: Record<BreakdownId, { title: string; description: string }> = {
  operating: { title: "Saldo operativo", description: "Dinero que realmente existe hoy en tus cuentas de uso diario." },
  reserved: { title: "Reservas", description: "Dinero que sigue en tu cuenta, pero ya tiene un propósito." },
  committed: { title: "Compromisos", description: "Obligaciones reales que vencen antes de tu próximo pago." },
  cushion: { title: "Colchón operativo", description: "Un mínimo que nunca cuenta como dinero libre." },
};

/** Explains each line of "¿Cómo llegamos a esta cantidad?". */
export function BreakdownDetailSheet({ id, onClose }: { id: BreakdownId | null; onClose: () => void }) {
  const { state, snapshot } = useFinance();
  const { openForm } = useShell();
  const [last, setLast] = useState<BreakdownId>("operating");
  if (id && id !== last) setLast(id);
  const current = id ?? last;
  const meta = TITLES[current];

  return (
    <Sheet open={Boolean(id)} onClose={onClose} title={meta.title} description={meta.description} size="sm">
      {current === "operating" && (
        <>
        <dl className="divide-y divide-line text-[15px]">
          {operationalAccounts(state.accounts).map((a) => (
            <div key={a.id} className="flex justify-between gap-3 py-3">
              <dt className="text-ink">{a.name}</dt>
              <dd className="font-semibold">
                <MoneyValue amount={a.balance} />
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 py-3 font-bold">
            <dt>Total</dt>
            <dd>
              <MoneyValue amount={snapshot.operating} decimals={2} />
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[13px] leading-5 text-ink-2">
          Tu ahorro protegido (<MoneyValue amount={snapshot.protectedSavings} tone="inherit" />) vive en otra cuenta y no
          forma parte de este saldo.
        </p>
        </>
      )}

      {current === "reserved" &&
        (state.reserves.length ? (
          <div className="-mx-3.5 divide-y divide-line">
            {state.reserves.map((r) => (
              <ReserveCard key={r.id} reserve={r} accountName={state.accounts.find((a) => a.id === r.accountId)?.shortName} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Lock}
            title="Todavía no tienes reservas."
            description="Aparta dinero para algo próximo sin moverlo de tu cuenta."
            action={{ label: "Crear reserva", onClick: () => { onClose(); openForm("reserve"); } }}
          />
        ))}

      {current === "committed" &&
        (state.commitments.length ? (
          <ul className="divide-y divide-line">
            {state.commitments.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 py-3">
                <span>
                  <span className="block text-[15px] font-semibold text-ink">{c.name}</span>
                  <span className="text-[13px] text-ink-2">Vence el {formatDayMonth(c.dueDate)}</span>
                </span>
                <MoneyValue amount={c.amount} className="text-[15px] font-semibold" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Landmark}
            title={`Sin compromisos antes del ${formatDayMonth(state.payday.date)}`}
            description="Cuando registres una cuota o factura con vencimiento cercano, se descontará aquí."
          />
        ))}

      {current === "cushion" && (
        <div className="space-y-3 text-[15px] leading-6 text-ink">
          <p className="text-[28px] font-bold leading-9">
            <MoneyValue amount={snapshot.cushion} />
          </p>
          <p className="text-ink-2">
            Es tu red para imprevistos reales: una llanta, una medicina, un pasaje urgente. Por eso nunca se muestra como
            dinero que puedes gastar hoy.
          </p>
          <p className="text-ink-2">Si una compra lo tocara, el simulador te lo diría antes de registrarla.</p>
        </div>
      )}
    </Sheet>
  );
}
