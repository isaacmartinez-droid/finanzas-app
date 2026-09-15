"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ToastInput {
  title: string;
  /** ReactNode so amounts can go through <MoneyValue> and respect privacy mode. */
  description?: React.ReactNode;
  tone?: "success" | "info";
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/**
 * Lightweight confirmations ("Gasto registrado"). Important errors are
 * always shown inline as well — never only as a toast (spec §66).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        // z-55: above the bottom nav (40), below sheets (60) so a toast never intercepts taps inside an open sheet.
        className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[55] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "info" ? Info : CircleCheck;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[12px] bg-ink px-4 py-3 text-bg shadow-overlay motion-safe:animate-[toast-in_200ms_var(--ease-standard)] dark:bg-elevated dark:text-ink dark:ring-1 dark:ring-line"
            >
              <Icon
                aria-hidden
                size={18}
                strokeWidth={1.8}
                className={cn("mt-0.5 shrink-0", t.tone === "info" ? "text-[#93C5FD] dark:text-info" : "text-[#5EEAD4] dark:text-positive")}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-5">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-5 opacity-80">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar aviso"
                className="-m-2 grid size-10 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100"
              >
                <X aria-hidden size={16} strokeWidth={1.8} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
