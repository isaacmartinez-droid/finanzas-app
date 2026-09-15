import { ArrowDownLeft, ArrowUpRight, Check, Flag, PiggyBank, type LucideIcon } from "lucide-react";
import type { ISODate } from "@/types/finance";
import { cn } from "@/lib/cn";
import { daysBetween, formatDayMonth, pluralDays, relativeDayLabel } from "@/lib/dates";
import type { TimelineEntry, TimelineMarker } from "@/lib/timeline";
import { TransactionStatusBadge } from "./FinancialStatusBadge";
import { MoneyValue } from "./MoneyValue";

const markers: Record<TimelineMarker, { icon?: LucideIcon; className: string }> = {
  now: { className: "bg-primary-solid ring-4 ring-primary-soft" },
  done: { icon: Check, className: "bg-neutral-bg text-ink-2 border border-line-strong" },
  income: { icon: ArrowDownLeft, className: "bg-info-bg text-info border border-dashed border-info/50" },
  expense: { icon: ArrowUpRight, className: "bg-surface text-ink-2 border border-line-strong" },
  saving: { icon: PiggyBank, className: "bg-saving-bg text-saving" },
  payday: { icon: Flag, className: "bg-primary-solid text-on-primary" },
};

function dateLabel(date: ISODate, today: ISODate) {
  const rel = relativeDayLabel(date, today);
  if (rel) return `${formatDayMonth(date)} · ${rel}`;
  const d = daysBetween(today, date);
  return d > 0 ? `${formatDayMonth(date)} · en ${pluralDays(d)}` : formatDayMonth(date);
}

export interface TimelineItemProps {
  entry: TimelineEntry;
  today: ISODate;
  last?: boolean;
  onSelect?: (entry: TimelineEntry) => void;
}

/** One event: 22px marker on a 2px rail — never its own card (spec §32). */
export function TimelineItem({ entry, today, last, onSelect }: TimelineItemProps) {
  const m = markers[entry.marker];
  const Icon = m.icon;
  const interactive = Boolean(onSelect && entry.transaction);

  const body = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="text-[13px] leading-5 text-ink-2">{dateLabel(entry.date, today)}</span>
        {entry.status && <TransactionStatusBadge status={entry.status} />}
      </span>
      <span className="mt-0.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[15px] font-semibold leading-5 text-ink">{entry.title}</span>
        {entry.amount !== undefined && (
          <span className="shrink-0 text-right">
            <MoneyValue
              amount={entry.amount}
              currency={entry.currency}
              sign={entry.sign}
              tone={entry.tone}
              className="text-[15px] font-semibold leading-5"
            />
            {entry.approxNio !== undefined && (
              <span className="block text-[12px] leading-4 text-ink-2">
                <MoneyValue amount={entry.approxNio} decimals={0} approx tone="inherit" />
              </span>
            )}
          </span>
        )}
      </span>
    </>
  );

  return (
    <li className={cn("relative pl-9", !last && "pb-5")}>
      {!last && <span aria-hidden className="absolute bottom-0 left-[10px] top-[22px] w-0.5 bg-line" />}
      <span
        aria-hidden
        className={cn("absolute left-0 top-0.5 grid size-[22px] place-items-center rounded-full", m.className)}
      >
        {Icon && <Icon size={12} strokeWidth={2.2} />}
      </span>
      {interactive ? (
        <button
          type="button"
          onClick={() => onSelect?.(entry)}
          className="-mx-2 -my-1.5 block w-[calc(100%+1rem)] rounded-[10px] px-2 py-1.5 text-left transition-colors duration-150 hover:bg-subtle"
        >
          {body}
        </button>
      ) : (
        <div>{body}</div>
      )}
    </li>
  );
}

export function FinancialTimeline({
  entries,
  today,
  onSelect,
  className,
  label,
}: {
  entries: TimelineEntry[];
  today: ISODate;
  onSelect?: (entry: TimelineEntry) => void;
  className?: string;
  label: string;
}) {
  return (
    <ol aria-label={label} className={cn("pt-1", className)}>
      {entries.map((entry, i) => (
        <TimelineItem key={entry.id} entry={entry} today={today} last={i === entries.length - 1} onSelect={onSelect} />
      ))}
    </ol>
  );
}
