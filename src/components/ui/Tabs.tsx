"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string> {
  label: string;
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** id of the element whose content these tabs filter. */
  controls?: string;
  className?: string;
}

/**
 * Pill tabs (32px visual, 44px hit area). Active = blue + white text (spec §46).
 * Tablist semantics with roving focus.
 */
export function Tabs<T extends string>({ label, items, value, onValueChange, controls, className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onValueChange(items[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1.5", className)}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "hit-area inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150",
              selected
                ? "bg-primary-solid text-on-primary"
                : "border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("money text-[12px]", selected ? "text-on-primary/80" : "text-ink-2")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/** Single-select chips with radio semantics — used inside the filters sheet and forms. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
  disabled,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <fieldset className={className}>
      <legend className="text-[13px] font-semibold leading-5 text-ink">{label}</legend>
      <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-x-2 gap-y-3">
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(o.value)}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const next = (i + d + options.length) % options.length;
                onValueChange(options[next].value);
                refs.current[next]?.focus();
              }}
              className={cn(
                "hit-area inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150",
                disabled
                  ? selected
                    ? "cursor-not-allowed border border-control-line bg-neutral-bg text-ink-2"
                    : "cursor-not-allowed border border-control-line bg-surface text-ink-3"
                  : selected
                    ? "bg-primary-solid text-on-primary"
                    : "border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
