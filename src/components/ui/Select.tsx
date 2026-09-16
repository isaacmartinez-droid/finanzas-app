"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { FieldLabel, FieldMessage, inputClasses } from "./Input";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label: string;
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  error?: string;
}

/** Native select: uses the OS picker on phones, which is the most thumb-friendly option. */
export function Select({ label, options, value, onValueChange, hint, error, className, id: idProp, ...props }: SelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const messageId = `${id}-msg`;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(inputClasses, "appearance-none pr-10")}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={1.8}
          className={cn(
            "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2",
            props.disabled && "text-ink-3",
          )}
        />
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
