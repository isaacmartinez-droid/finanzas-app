"use client";

import { forwardRef, useId, useImperativeHandle, useRef } from "react";
import type { Currency } from "@/types/finance";
import { cn } from "@/lib/cn";
import { CURRENCY_SYMBOL, formatAmountInput, parseAmount, sanitizeAmountInput } from "@/lib/format";
import { FieldMessage } from "./Input";

export interface MoneyInputProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  currency: Currency;
  error?: string;
  hint?: React.ReactNode;
  size?: "hero" | "md";
  id?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Amount field with a persistent label and `inputmode="decimal"`.
 * The hero variant is the 28px centered input used by the simulator.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { label, value, onValueChange, currency, error, hint, size = "md", id: idProp, className, autoFocus, disabled },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const messageId = `${id}-msg`;
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const hero = size === "hero";
  const chars = Math.max(value.length, 4);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "block font-semibold",
          hero ? "text-center text-[12px] uppercase tracking-[0.06em] text-ink-2" : "text-[13px] leading-5 text-ink",
        )}
      >
        {label}
      </label>
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className={cn(
          "mt-2 flex min-w-0 items-baseline overflow-hidden rounded-input border transition-colors duration-150",
          disabled
            ? "cursor-not-allowed border-control-line bg-neutral-bg text-ink-2"
            : "cursor-text bg-surface focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-primary",
          error ? "border-risk" : !disabled && "border-control-line hover:border-ink-2",
          hero ? "justify-center px-4 py-3.5" : "px-3.5 py-2",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "money shrink-0 font-bold",
            "text-ink-2",
            hero ? "text-[28px] leading-9" : "text-[20px] leading-7",
          )}
        >
          {CURRENCY_SYMBOL[currency]}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder="0.00"
          value={value}
          onChange={(e) => onValueChange(sanitizeAmountInput(e.target.value))}
          onBlur={() => {
            const parsed = parseAmount(value);
            if (parsed !== null) onValueChange(formatAmountInput(parsed));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          style={hero ? { width: `calc(${chars}ch + 4px)` } : undefined}
          className={cn(
            "money min-w-0 bg-transparent font-bold text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed disabled:text-ink-2",
            hero ? "max-w-full text-[28px] leading-9" : "flex-1 text-[20px] leading-7",
          )}
        />
      </div>
      <div className={cn(hero && "text-center")}>
        <FieldMessage id={messageId} error={error} hint={hint} />
      </div>
    </div>
  );
});
