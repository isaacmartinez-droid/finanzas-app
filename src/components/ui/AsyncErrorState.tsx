"use client";

import { useId } from "react";
import { RotateCcw, ServerCrash } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Card } from "./Card";

export interface AsyncErrorStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
  retryLabel?: string;
  className?: string;
}

/** Recoverable, accessible failure state for data-backed views. */
export function AsyncErrorState({
  title = "No pudimos cargar esta información.",
  description = "Revisa tu conexión e intenta nuevamente.",
  onRetry,
  retryLabel = "Reintentar",
  className,
}: AsyncErrorStateProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Card
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn("flex flex-col items-center px-5 py-9 text-center", className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-risk-bg text-risk">
        <ServerCrash aria-hidden size={22} strokeWidth={1.8} />
      </span>
      <h2 id={titleId} className="mt-3 text-[17px] font-bold leading-6 text-ink">
        {title}
      </h2>
      <p id={descriptionId} className="mt-1 max-w-[40ch] text-[14px] leading-5 text-ink-2">
        {description}
      </p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        <RotateCcw aria-hidden size={17} strokeWidth={1.8} />
        {retryLabel}
      </Button>
    </Card>
  );
}
