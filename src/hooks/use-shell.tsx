"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CategoryId, Currency } from "@/types/finance";

export type FormMode = "expense" | "income" | "reserve" | "transfer";

export interface FormPrefill {
  amount?: number;
  currency?: Currency;
  title?: string;
  categoryId?: CategoryId;
  accountId?: string;
}

interface ShellValue {
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  form: { mode: FormMode; prefill?: FormPrefill } | null;
  openForm: (mode: FormMode, prefill?: FormPrefill) => void;
  closeForm: () => void;
  accountMenuOpen: boolean;
  openAccountMenu: () => void;
  closeAccountMenu: () => void;
}

const ShellContext = createContext<ShellValue | null>(null);

/** UI-only state for global overlays (quick add, forms, account menu). */
export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAdd] = useState(false);
  const [form, setForm] = useState<ShellValue["form"]>(null);
  const [accountMenuOpen, setAccountMenu] = useState(false);

  const value = useMemo<ShellValue>(
    () => ({
      quickAddOpen,
      openQuickAdd: () => setQuickAdd(true),
      closeQuickAdd: () => setQuickAdd(false),
      form,
      openForm: (mode, prefill) => {
        setQuickAdd(false);
        setForm({ mode, prefill });
      },
      closeForm: () => setForm(null),
      accountMenuOpen,
      openAccountMenu: () => setAccountMenu(true),
      closeAccountMenu: () => setAccountMenu(false),
    }),
    [quickAddOpen, form, accountMenuOpen],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
