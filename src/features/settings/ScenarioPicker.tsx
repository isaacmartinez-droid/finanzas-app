"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { scenarioList } from "@/mocks/scenarios";
import { useFinance } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";

/** Demo-only: swaps the whole mock state to review every canonical status. */
export function ScenarioPicker({ onPicked }: { onPicked?: () => void }) {
  const { scenario, setScenario } = useFinance();
  const toast = useToast();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function pick(index: number) {
    const s = scenarioList[index];
    if (s.id === scenario) return;
    setScenario(s.id);
    toast({ title: `Escenario: ${s.label}`, description: s.description, tone: "info" });
    onPicked?.();
  }

  return (
    <div role="radiogroup" aria-label="Escenario de demostración" className="space-y-1">
      {scenarioList.map((s, i) => {
        const selected = s.id === scenario;
        return (
          <button
            key={s.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => pick(i)}
            onKeyDown={(e) => {
              const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const next = (i + d + scenarioList.length) % scenarioList.length;
              refs.current[next]?.focus();
            }}
            className={cn(
              "flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border px-3 py-2 text-left transition-colors duration-150",
              selected ? "border-primary bg-primary-soft" : "border-line hover:bg-subtle",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                selected ? "border-primary" : "border-line-strong",
              )}
            >
              {selected && <span className="size-2.5 rounded-full bg-primary" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-5 text-ink">{s.label}</span>
              <span className="block text-[13px] leading-5 text-ink-2">{s.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
