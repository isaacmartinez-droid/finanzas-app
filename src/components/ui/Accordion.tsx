"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
  buttonClassName?: string;
}

/** Disclosure with an animated height; collapsed content is inert. */
export function Accordion({
  title,
  children,
  defaultOpen = false,
  headingLevel: Heading = "h3",
  className,
  buttonClassName,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <Heading className="m-0">
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-3 text-left text-[15px] font-semibold text-ink",
            buttonClassName,
          )}
        >
          <span className="min-w-0">{title}</span>
          <ChevronDown
            aria-hidden
            size={18}
            strokeWidth={1.8}
            className={cn("shrink-0 text-ink-2 transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </Heading>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-[var(--ease-standard)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
