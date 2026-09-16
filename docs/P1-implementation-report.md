# Reporte de implementación P1

Entrega registrada: 2026-09-16. Reporte histórico de esta iteración; el contexto vigente y la lectura selectiva están en [README.md](README.md).

Alcance: frontend con estado en memoria. Se mantuvieron la arquitectura, navegación y design system; no se añadió backend, autenticación, base de datos ni APIs. No se implementaron P2/P3.

## Cambios por hallazgo

| ID | Resultado | Implementación |
| --- | --- | --- |
| DASH-03 | Cerrado | Colchón en el resumen del hero y `DashboardCalculationPreview` con “Ver cálculo”. Usa el snapshot central y reutiliza `CashFlowBreakdown`; explica también el resultado negativo y respeta privacidad. |
| DASH-11 | Parcial | `IncomeAllocationCard` muestra el último ingreso recibido, ahorro automático “No configurado” y monto disponible. No se inventó ninguna deducción. Bloqueo exacto abajo. |
| PLAN-01 | Cerrado para el MVP frontend | Presupuestos por categoría/ciclo con creación, edición, eliminación y gasto acumulado; reservas con detalle, edición y liberación; recurrencias existentes con frecuencia y pausa/reanudación. Todo permanece en memoria. |
| FORM-01 | Cerrado | Estados compartidos disabled/loading, bloqueo de doble envío, feedback accesible y dimensiones estables en Button y formularios; Input, Select, MoneyInput, textarea y controles de selección consistentes. |
| STATE-03 | Cerrado | `AsyncErrorState` en Inicio, Movimientos, Ahorro, Plan y resultado del Simulador. Reintento recuperable; activación de error de datos solo en desarrollo/test, bloqueada en producción. |
| A11Y-05 | Cerrado | Token `--control-border` claro/oscuro en controles, hover con contraste suficiente y foco existente conservado. |
| PERF-01 | Cerrado | Inter variable local con licencia y `next/font/local`. No hay importaciones de `next/font/google` ni URLs de Google Fonts en `src`. |
| QA-01 | Cerrado | Un solo framework: Playwright para pruebas puras del modelo y pruebas de navegador reproducibles/versionadas. |

## Componentes creados

- `src/components/financial/DashboardCalculationPreview.tsx`
- `src/components/financial/IncomeAllocationCard.tsx`
- `src/components/ui/AsyncErrorState.tsx`
- `src/features/plan/ReserveDetailSheet.tsx`
- `src/features/plan/BudgetDetailSheet.tsx`
- `src/features/plan/RecurringDetailSheet.tsx`
- `TextAreaField` dentro de `src/components/ui/Input.tsx`.

## Componentes y lógica reutilizados

- `CashFlowBreakdown`, `FinancialSummary`, `AvailableMoneyHero`, `MoneyValue` y `ReserveCard`.
- `Sheet` con sus variantes responsive, cierre con Escape, gestión de foco y animaciones existentes.
- `Button`, `TextField`, `FieldLabel`, `FieldMessage`, `Select`, `MoneyInput`, `SegmentedControl`, `ChipGroup`, `Tabs`, `Badge`, `Card`, `SectionHeader`, `Progress` y `EmptyState`.
- `getSnapshot`, `isUpcoming`, conversión/redondeo monetario, categorías y fechas existentes.
- El reducer y contexto de `use-finance`, `use-shell`, preferencias y toasts. No se creó una segunda fuente de verdad financiera.

## Archivos existentes modificados

### DASH-03 / DASH-11

- `src/features/dashboard/DashboardView.tsx`
- `src/features/dashboard/dashboard.module.css` — integración de las tarjetas, sin cambiar navegación.
- `src/components/financial/CashFlowBreakdown.tsx` — filas no interactivas cuando no existe acción.
- `src/components/financial/FinancialSummary.tsx` — marcador de colchón.

### PLAN-01

- `src/features/plan/PlanView.tsx`
- `src/features/savings/SavingsView.tsx` — reutiliza la administración de reservas.
- `src/components/financial/ReserveCard.tsx` — selección opcional accesible.
- `src/hooks/use-finance.tsx` — acciones de administración en el reducer existente.
- `src/lib/finance.ts` — gasto por presupuesto, último ingreso recibido y exclusión de recurrencias pausadas de las proyecciones.
- `src/types/finance.ts` — presupuesto local y estado activo opcional de recurrencia.
- `src/mocks/scenarios.ts` — presupuestos inicialmente vacíos; sin límites inventados.

### FORM-01 / A11Y-05

- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/MoneyInput.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/SegmentedControl.tsx`
- `src/components/ui/Tabs.tsx` — estados disabled de ChipGroup.
- `src/components/financial/SimulationInput.tsx`
- `src/features/quick-add/TransactionFormSheet.tsx`
- `src/styles/globals.css`

### STATE-03

- `src/features/transactions/TransactionsView.tsx`
- `src/features/settings/SettingsView.tsx`
- `src/components/financial/SimulationResult.tsx`
- También Dashboard, Ahorro, Plan y `use-finance`, enumerados arriba.

### PERF-01 / QA-01 / documentación

- `src/app/layout.tsx`
- `package.json` y `package-lock.json` — solo `@playwright/test` como nueva dependencia de desarrollo y script `test`.
- `.gitignore` — excluye reportes y resultados generados de Playwright.
- `README.md` — instalación, pruebas, fuente local, MVP y bloqueo DASH-11.

### Otros archivos nuevos

- `src/app/fonts/InterVariable.woff2` y `src/app/fonts/LICENSE.txt`.
- `playwright.config.ts`.
- `tests/finance.spec.ts`, `tests/critical-ui.spec.ts` y `tests/plan.spec.ts`.
- Este reporte.

`AGENTS.md` y `CLAUDE.md` ya estaban presentes como archivos no versionados generados por el entorno; se conservaron y no forman parte de los cambios P1.

## Pruebas y verificaciones

Diez pruebas versionadas:

1. Monto gastable no negativo y nunca mayor al saldo operativo, en todos los escenarios.
2. Reservas, compromisos y colchón restados una sola vez, con los valores del modelo.
3. Simulador produce Seguro, Ajustado y No recomendado con reglas centrales (prueba de lógica).
4. Dashboard muestra el hero y explica su cifra con “Ver cálculo”.
5. Privacidad oculta el hero y su desglose.
6. Quick Add abre, cierra por Escape y botón, y devuelve el foco.
7. Dashboard sin desborde horizontal en 320, 375, 768 y 1366 px.
8. Reserva: editar monto y liberar.
9. Presupuesto: crear y eliminar.
10. Recurrencia: pausar y representar el estado pausado.

Resultados finales:

- `npm test`: 10 pruebas correctas en Chromium (16.4 s), código de salida 0.
- `npm run typecheck`: correcto, código de salida 0.
- `npm run build`: correcto, código de salida 0; generación de rutas estáticas completada.
- `git diff --check`: correcto.
- Contraste calculado del borde normal: aproximadamente 3.16:1 frente a superficie blanca en claro y 3.73:1 frente a `#111827` en oscuro. Frente al fondo claro `#faf8ff`: aproximadamente 3.00:1. Hover usa `text-2`, no el anterior borde tenue.
- Build usa el WOFF2 incluido en el repositorio; no se realizó una prueba con toda la red deshabilitada. La descarga del navegador para instalar Playwright es independiente del build.

La repetición final reutiliza el servidor de desarrollo existente mediante `PLAYWRIGHT_BASE_URL=http://localhost:3000`, sin detenerlo. Un intento previo con otro hostname fue bloqueado por la protección de origen de Next.js. El puerto predeterminado de las pruebas es 3100 cuando no hay otro servidor de la misma aplicación.

El build conserva un aviso preexistente sobre un `package-lock.json` fuera del repositorio, en `C:/Users/Deku8`. No impide compilar y no se cambió configuración de raíz por quedar fuera de esta iteración.

## Único requisito P1 sin cerrar por completo

**DASH-11: aplicación y explicación de ahorro automático real.**

El modelo/mocks actuales no contienen una regla de ahorro automático (monto o porcentaje, condiciones de aplicación, cuenta destino ni vínculo entre ingreso y reserva). La reserva de ahorro ya existente no demuestra que proceda automáticamente del último ingreso recibido.

Por eso la tarjeta muestra “No configurado”, explica que no se apartó dinero automáticamente y conserva como remanente el ingreso recibido completo. Para completar ese paso se debe definir explícitamente la regla y su relación con el ingreso. No se asumió que la reserva existente fuera una deducción automática.

## Límites preservados

- Presupuestos son límites elegidos por el usuario para el ciclo actual; no crean reservas ni modifican el dinero libre.
- La administración de recurrencias cambia datos de las series existentes y su participación en la proyección. No genera un calendario ni nuevas ocurrencias; las fechas ya registradas se conservan.
- Recargar o cambiar escenario restablece los datos financieros mock, igual que antes.
- Aportes, Calendario completo, Deudas, Reportes y el resto de P2/P3 no se implementaron.

## Reproducción

```bash
npm ci
npx playwright install chromium
npm test
npm run typecheck
npm run build
```

Con un servidor ya abierto en el puerto 3000, en PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3000'
npm test
```

Fuente local obtenida del proyecto oficial Inter: `https://github.com/rsms/inter/blob/master/docs/font-files/InterVariable.woff2`; licencia incluida del mismo proyecto. SHA-256 del WOFF2: `693B77D4F32EE9B8BFC995589B5FAD5E99ADF2832738661F5402F9978429A8E3`.
