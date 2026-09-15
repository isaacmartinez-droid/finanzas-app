"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/navigation/Brand";
import { SIDEBAR_NAV } from "@/components/navigation/nav-items";
import { Switch } from "@/components/ui/Feedback";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { mockUser } from "@/mocks/user";
import { usePreferences, type ThemePreference } from "@/hooks/use-preferences";
import { useShell } from "@/hooks/use-shell";
import { ScenarioPicker } from "./ScenarioPicker";

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

/**
 * Opened from the avatar. On phones it is also the door to the sections
 * that don't fit in the bottom nav (Ahorro, Deudas, Reportes, Configuración).
 */
export function AccountMenuSheet() {
  const { accountMenuOpen, closeAccountMenu } = useShell();
  const { theme, setTheme, amountsHidden, toggleAmounts } = usePreferences();
  const secondary = SIDEBAR_NAV.slice(4);

  return (
    <Sheet open={accountMenuOpen} onClose={closeAccountMenu} title="Tu cuenta" desktop="drawer" size="sm">
      <div className="flex items-center gap-3 rounded-[12px] bg-subtle p-3">
        <Avatar initials={mockUser.initials} className="size-11 text-[15px]" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-ink">
            {mockUser.firstName} {mockUser.lastName}
          </p>
          <p className="text-[13px] text-ink-2">Prototipo · datos simulados</p>
        </div>
      </div>

      <section aria-labelledby="menu-more" className="mt-5 md:hidden">
        <h3 id="menu-more" className="text-[13px] font-semibold text-ink-2">
          Más secciones
        </h3>
        <ul className="mt-1.5 divide-y divide-line rounded-[12px] border border-line">
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeAccountMenu}
                  className="flex min-h-12 items-center gap-3 px-3 text-[15px] font-medium text-ink hover:bg-subtle"
                >
                  <Icon aria-hidden size={18} strokeWidth={1.8} className="text-ink-2" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="text-ink-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="menu-display" className="mt-5">
        <h3 id="menu-display" className="text-[13px] font-semibold text-ink-2">
          Apariencia
        </h3>
        <SegmentedControl className="mt-2" fullWidth label="Tema" value={theme} onValueChange={setTheme} options={THEME_OPTIONS} />
        <div className="mt-2">
          <Switch
            checked={amountsHidden}
            onCheckedChange={toggleAmounts}
            label="Ocultar montos"
            description="Muestra C$ •••••• en toda la app. Etiquetas y fechas siguen visibles."
          />
        </div>
      </section>

      <section aria-labelledby="menu-scenario" className="mt-5">
        <h3 id="menu-scenario" className="text-[13px] font-semibold text-ink-2">
          Escenario de demostración
        </h3>
        <p className="mt-0.5 text-[13px] leading-5 text-ink-2">Cambia los datos simulados para revisar cada estado.</p>
        <div className="mt-2">
          <ScenarioPicker onPicked={closeAccountMenu} />
        </div>
      </section>
    </Sheet>
  );
}
