import { Lock } from "lucide-react";
import type { Reserve } from "@/types/finance";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { MoneyValue } from "./MoneyValue";

/** A reserve row: money that stays in the account but already has a purpose. */
export function ReserveCard({ reserve, accountName, className }: { reserve: Reserve; accountName?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-3.5 py-3", className)}>
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-saving-bg text-saving">
        <Lock aria-hidden size={18} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[15px] font-semibold leading-5 text-ink">{reserve.name}</p>
          <MoneyValue amount={reserve.amount} tone="saving" className="shrink-0 text-[15px] font-semibold" />
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="truncate text-[13px] leading-5 text-ink-2">
            {[accountName, reserve.targetDate && `hasta el ${formatDayMonth(reserve.targetDate)}`].filter(Boolean).join(" · ")}
          </p>
          <Badge tone="saving">{reserve.purpose === "savings" ? "Ahorro" : "Reservado"}</Badge>
        </div>
      </div>
    </div>
  );
}
