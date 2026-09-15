"use client";

import { useState } from "react";
import { ChevronRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { DailyChange } from "@/types/finance";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { MoneyDelta, MoneyValue } from "./MoneyValue";

export interface WhatChangedProps {
  changes: DailyChange[];
  netChange: number;
  yesterdayFree: number;
  free: number;
}

/** "Hoy puedes gastar C$700 más que ayer" — or a neutral phrasing when either day was below zero. */
export function WhatChangedHeadline({ netChange, yesterdayFree, free }: Omit<WhatChangedProps, "changes">) {
  if (Math.abs(netChange) < 0.005) return <>Sin cambios en tu dinero libre desde ayer</>;
  const amount = <MoneyValue amount={Math.abs(netChange)} tone="inherit" className="font-bold" />;
  const bothPositive = yesterdayFree >= 0 && free >= 0;
  if (bothPositive) {
    return (
      <>
        Hoy puedes gastar {amount} {netChange > 0 ? "más" : "menos"} que ayer
      </>
    );
  }
  return (
    <>
      Tu dinero libre {netChange > 0 ? "subió" : "bajó"} {amount} desde ayer
    </>
  );
}

export function WhatChangedList({ changes, netChange, yesterdayFree, free }: WhatChangedProps) {
  return (
    <div>
      <ul className="space-y-1">
        {changes.map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-4 py-1.5">
            <span className="min-w-0 truncate text-[15px] text-ink">{c.label}</span>
            <MoneyDelta amount={c.delta} className="shrink-0 text-[15px] font-semibold" />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <span className="text-[15px] font-bold text-ink">Cambio neto</span>
        <MoneyDelta amount={netChange} className="text-[18px] font-bold" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-inner bg-subtle p-3 text-[13px]">
        <div>
          <dt className="text-ink-2">Dinero libre ayer</dt>
          <dd className="mt-0.5 text-[15px] font-semibold">
            <MoneyValue amount={yesterdayFree} decimals={2} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-2">Dinero libre hoy</dt>
          <dd className="mt-0.5 text-[15px] font-semibold">
            <MoneyValue amount={free} decimals={2} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TrendIcon({ net, className }: { net: number; className?: string }) {
  const Icon = net > 0 ? TrendingUp : net < 0 ? TrendingDown : Minus;
  return <Icon aria-hidden size={16} strokeWidth={1.8} className={className} />;
}

/** Compact preview that opens the full explanation (spec §34). Lives in the hero footer. */
export function WhatChangedPreview(props: WhatChangedProps & { className?: string }) {
  const [open, setOpen] = useState(false);
  const { netChange, className } = props;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-inner border border-line px-3 py-2 text-left transition-colors duration-150 hover:bg-subtle",
          className,
        )}
      >
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full",
            netChange > 0 ? "bg-positive-bg text-positive" : "bg-neutral-bg text-ink-2",
          )}
        >
          <TrendIcon net={netChange} />
        </span>
        <span className="min-w-0 flex-1 text-[14px] leading-5 text-ink">
          <WhatChangedHeadline {...props} />
          <span className="block text-[13px] font-semibold text-primary">Ver qué cambió</span>
        </span>
        <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-3" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="¿Qué cambió hoy?" description={<WhatChangedHeadline {...props} />} size="sm">
        <WhatChangedList {...props} />
      </Sheet>
    </>
  );
}

/** Full card used on "Hasta mi pago" (spec §41). */
export function WhatChangedCard(props: WhatChangedProps & { className?: string }) {
  const { changes, netChange, className } = props;
  return (
    <Card aria-labelledby="changed-title" className={className}>
      <h2 id="changed-title" className="text-[16px] font-bold leading-6 text-ink">
        ¿Qué cambió hoy?
      </h2>
      <p className="mt-1 text-[22px] font-bold leading-7">
        <MoneyDelta amount={netChange} /> <span className="text-[14px] font-semibold text-ink-2">netos</span>
      </p>
      <ul className="mt-2 divide-y divide-line">
        {changes.map((c) => (
          <li key={c.id} className="flex items-baseline gap-3 py-2">
            <MoneyDelta amount={c.delta} className="w-24 shrink-0 text-[15px] font-semibold" />
            <span className="min-w-0 truncate text-[15px] text-ink">{c.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
