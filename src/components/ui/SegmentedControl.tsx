"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Accessible name when the visible label is not descriptive enough. */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

/** Radio-group semantics with roving focus (← →). */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
  fullWidth,
  disabled,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onValueChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn("inline-flex rounded-[12px] bg-neutral-bg p-0.5", fullWidth && "flex w-full", className)}
    >
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
            aria-label={o.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "min-h-11 min-w-14 flex-1 whitespace-nowrap rounded-[10px] px-2.5 text-[14px] font-semibold transition-colors duration-150",
              disabled
                ? selected
                  ? "cursor-not-allowed bg-surface text-ink-2 shadow-card dark:bg-elevated"
                  : "cursor-not-allowed text-ink-3"
                : selected
                  ? "bg-surface text-ink shadow-card dark:bg-elevated"
                  : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
