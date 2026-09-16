"use client";

import { forwardRef, useId } from "react";
import { CircleAlert, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function FieldLabel({
  htmlFor,
  id,
  children,
  optional,
  className,
}: {
  htmlFor?: string;
  id?: string;
  children: React.ReactNode;
  optional?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} id={id} className={cn("block text-[13px] font-semibold leading-5 text-ink", className)}>
      {children}
      {optional && <span className="font-normal text-ink-2"> (opcional)</span>}
    </label>
  );
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: React.ReactNode }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 text-risk">
        <CircleAlert aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-[13px] leading-5 text-ink-2">
        {hint}
      </p>
    );
  }
  return null;
}

export const inputClasses =
  "h-11 w-full min-w-0 rounded-input border border-control-line bg-surface px-3.5 text-[15px] text-ink transition-colors duration-150 enabled:hover:border-ink-2 focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border-control-line disabled:bg-neutral-bg disabled:text-ink-2 aria-[invalid=true]:border-risk";

export const textAreaClasses = cn(inputClasses, "h-auto min-h-24 py-3");

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
}

/** Persistent visible label, inline validation, never placeholder-only (spec §82). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, id: idProp, className, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const messageId = `${id}-msg`;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(inputClasses, "mt-1.5")}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
});

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, hint, error, optional, id: idProp, className, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const messageId = `${id}-msg`;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(textAreaClasses, "mt-1.5")}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
});

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

/** 44px search field, 12px radius (spec §44). Label is visually hidden but announced. */
export function SearchInput({ label, value, onValueChange, className, id: idProp, ...props }: SearchInputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        size={18}
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(inputClasses, "pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden")}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Borrar búsqueda"
          className="absolute right-0.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink-2 hover:text-ink"
        >
          <X aria-hidden size={16} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
