"use client";

import { MoneyValue } from "@/components/financial/MoneyValue";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Feedback";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatDayMonth } from "@/lib/dates";
import { useFinance } from "@/hooks/use-finance";
import { usePreferences } from "@/hooks/use-preferences";
import { THEME_OPTIONS } from "./AccountMenuSheet";
import { ScenarioPicker } from "./ScenarioPicker";

export function SettingsView() {
  const { state, demo, setDemo } = useFinance();
  const { theme, setTheme, amountsHidden, toggleAmounts } = usePreferences();

  return (
    <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
      <div className="space-y-4">
        <Card aria-labelledby="set-appearance">
          <SectionHeader id="set-appearance" title="Apariencia" />
          <SegmentedControl className="mt-3" fullWidth label="Tema" value={theme} onValueChange={setTheme} options={THEME_OPTIONS} />
          <div className="mt-2">
            <Switch
              checked={amountsHidden}
              onCheckedChange={toggleAmounts}
              label="Ocultar montos"
              description="Se aplica a toda la app: inicio, movimientos, ahorro, simulador y reportes."
            />
          </div>
        </Card>

        <Card aria-labelledby="set-rules">
          <SectionHeader id="set-rules" title="Tus reglas" />
          <dl className="mt-2 divide-y divide-line text-[14px]">
            {[
              { label: "Colchón operativo", value: <MoneyValue amount={state.cushion} /> },
              { label: "Gasto diario cómodo", value: <><MoneyValue amount={state.comfortDailyTarget} />/día</> },
              { label: "Próximo pago", value: `${state.payday.label} · ${formatDayMonth(state.payday.date)}` },
              { label: "Tipo de cambio", value: `C$${state.exchangeRate} por US$1` },
            ].map((r) => (
              <div key={r.label} className="flex justify-between gap-3 py-2.5">
                <dt className="text-ink-2">{r.label}</dt>
                <dd className="text-right font-semibold text-ink">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[13px] leading-5 text-ink-2">Editar estas reglas llegará cuando exista el backend.</p>
        </Card>
      </div>

      <div className="space-y-4">
        <Card aria-labelledby="set-scenario">
          <SectionHeader id="set-scenario" title="Escenario de demostración" />
          <p className="mb-3 mt-0.5 text-[13px] leading-5 text-ink-2">Todos los números salen del mismo cálculo, así que cada pantalla cambia de forma coherente.</p>
          <ScenarioPicker />
        </Card>

        <Card aria-labelledby="set-qa">
          <SectionHeader id="set-qa" title="Estados de interfaz" />
          <div className="mt-1 divide-y divide-line">
            <Switch
              checked={demo.slowLoading}
              onCheckedChange={(slowLoading) => setDemo({ slowLoading })}
              label="Carga lenta"
              description="Alarga los skeletons al cambiar de escenario."
            />
            <Switch
              checked={demo.simulatorError}
              onCheckedChange={(simulatorError) => setDemo({ simulatorError })}
              label="Fallar el simulador"
              description="Muestra el estado de error sin borrar lo que escribiste."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
