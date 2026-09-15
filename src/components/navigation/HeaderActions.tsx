"use client";

import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { usePreferences } from "@/hooks/use-preferences";
import { useShell } from "@/hooks/use-shell";
import { mockUser } from "@/mocks/user";
import { Avatar } from "./Brand";

export function PrivacyToggle() {
  const { amountsHidden, toggleAmounts } = usePreferences();
  return (
    <IconButton
      icon={amountsHidden ? EyeOff : Eye}
      label={amountsHidden ? "Mostrar montos" : "Ocultar montos"}
      aria-pressed={amountsHidden}
      onClick={toggleAmounts}
    />
  );
}

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = usePreferences();
  return (
    <IconButton
      icon={resolvedTheme === "dark" ? Sun : Moon}
      label={resolvedTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={toggleTheme}
    />
  );
}

export function AccountButton() {
  const { openAccountMenu } = useShell();
  return (
    <button
      type="button"
      onClick={openAccountMenu}
      aria-label={`Cuenta de ${mockUser.firstName}: tema, escenarios y más secciones`}
      aria-haspopup="dialog"
      className="grid size-11 shrink-0 place-items-center rounded-full"
    >
      <Avatar initials={mockUser.initials} />
    </button>
  );
}
