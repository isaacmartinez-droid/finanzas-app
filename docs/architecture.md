# Arquitectura y decisiones

Referencia del estado actual; para contexto general, ver [el índice](README.md).

## Organización

| Ubicación | Responsabilidad |
| --- | --- |
| `src/app/` | App Router: páginas delgadas, layout, providers y fuente local. |
| `src/features/` | Vistas y sheets por dominio: dashboard, cash-flow, transactions, simulator, plan, savings, quick-add y settings. |
| `src/components/ui/` | Design system reutilizable, sin reglas financieras. |
| `src/components/financial/` | Presentación de importes, estados, proyecciones y protecciones. |
| `src/components/navigation/` | AppShell, header, navegación y mapa de rutas. |
| `src/hooks/` | Contextos de finanzas, preferencias, overlays y toasts. |
| `src/lib/` | Cálculo financiero, formato, fechas, categorías y transformación de datos para presentación. |
| `src/domain/financial-engine/` | Dominio puro v1: dinero exacto, ledger confirmado, reconciliación, reservas, ingresos y proyecciones. No está conectado a React ni persistencia. |
| `src/db/` | Esquema Drizzle, cliente PostgreSQL server-only y repositorios transaccionales. Ningún componente cliente lo importa. |
| `src/lib/auth0.ts`, `src/lib/current-user.ts`, `src/proxy.ts` | Auth0 v4, límite de sesión y resolución del propietario interno. |
| `src/app/api/` | Route Handlers protegidos para perfil, cuentas y publicación idempotente de hechos ledger. |
| `src/mocks/` | Datos iniciales, escenarios y borrador del simulador. |
| `src/types/finance.ts` | Contratos del dominio. |
| `src/styles/globals.css` | Tokens light/dark, Tailwind, privacidad y utilidades. |
| `tests/` | Pruebas del modelo y navegador con Playwright. |

Alias TypeScript: `@/*` apunta a `src/*`. Configuración estricta en [tsconfig.json](../tsconfig.json). [next.config.ts](../next.config.ts) activa Strict Mode y desactiva `poweredByHeader`; no contiene servicios externos.

## Estado y consumidores

Orden de [providers.tsx](../src/app/providers.tsx):

```text
PreferencesProvider
  FinanceProvider
    ToastProvider
      ShellProvider
        AppShell / páginas
```

- [use-finance.tsx](../src/hooks/use-finance.tsx): reducer en memoria, escenario, skeleton al cambiar escenario y flags de demo. Las acciones actualizan el estado; el contexto calcula un snapshot compartido.
- [use-authenticated-user.tsx](../src/hooks/use-authenticated-user.tsx): transporta nombre, correo e iniciales serializados desde el layout servidor hacia la navegación cliente; no recibe token ni secreto.
- [PersistedAccountsDashboard.tsx](../src/features/accounts/PersistedAccountsDashboard.tsx): para una sesión real, consulta y crea cuentas mediante la API; [AccountNameSheet.tsx](../src/features/accounts/AccountNameSheet.tsx) corrige únicamente su nombre. Evita presentar el `FinanceState` demo junto a saldos persistidos.
- [financial-engine-adapter.ts](../src/lib/financial-engine-adapter.ts): transforma `FinanceState` al contrato del motor. Usa los saldos mock ya actuales como apertura reconciliable y reserva las transacciones heredadas para proyección/presentación, evitando contar dos veces el historial demo.
- [use-preferences.tsx](../src/hooks/use-preferences.tsx): tema `light/dark/system`, privacidad y sidebar. Claves locales: `fin-theme`, `fin-privacy`, `fin-sidebar`. El script del layout aplica las preferencias antes del primer render.
- [use-shell.tsx](../src/hooks/use-shell.tsx): solo UI global: Quick Add, formulario con modo/prefill y menú de cuenta. Abrir un formulario cierra Quick Add.
- [use-toast.tsx](../src/hooks/use-toast.tsx): feedback transitorio; no es historial financiero ni mecanismo de persistencia.

`FinanceState` contiene cuentas, reservas, presupuestos, compromisos, transacciones, cambios del día, ciclo/pago, reglas y meta. `FinancialSnapshot` es derivado, no un segundo estado editable. Las preferencias sí sobreviven a una recarga; los datos financieros no.

## Componentes que conviene reutilizar

- Importes: `MoneyValue`; no incrustar montos en labels o descripciones que el modo privado no puede enmascarar.
- Hero/desglose: `AvailableMoneyHero`, `FinancialSummary`, `CashFlowBreakdown`, `DashboardCalculationPreview`.
- Estados: `Badge`, `FinancialStatusBadge`, `AsyncErrorState`; `LoadingRegion`, `Skeleton` y `EmptyState` viven en `Feedback.tsx`.
- Formularios: `Button`, `TextField`, `TextAreaField`, `Select`, `MoneyInput`, `SegmentedControl`, `ChipGroup` y mensajes persistentes.
- Overlays: `Sheet`, `BottomSheet`, `Drawer`, `Modal`. Preservar cierre por Escape, foco atrapado, retorno de foco, bloqueo de scroll y animación de salida.
- Administración: `ReserveDetailSheet` compartido entre Plan/Ahorro; `BudgetDetailSheet` y `RecurringDetailSheet` en Plan.

## Decisiones conservadas

1. `getSnapshot()` adapta el estado mock al FinancialEngine y `computeStatus()` interpreta su resultado para la UI. Dashboard, flujo de caja y simulador consumen el mismo snapshot; no mantener cifras independientes por pantalla.
2. Presupuesto organiza el gasto, reserva reduce disponibilidad, colchón protege saldo operativo y ahorro protegido pertenece a otra cuenta. No intercambiarlos.
3. Las series recurrentes actuales se agrupan por `type + title`; no existe `seriesId` ni generador de ocurrencias. Cambiar frecuencia conserva las fechas existentes.
4. Inter variable WOFF2 vive en `src/app/fonts/`, con licencia; [layout.tsx](../src/app/layout.tsx) usa `next/font/local` y `--font-inter`.
5. El token `--control-border` es distinto del borde decorativo. Hover/focus/disabled deben preservar legibilidad y contraste.
6. `AsyncErrorState` representa fallos; el interruptor de fallos de datos es exclusivo de desarrollo/test y el contexto impide activarlo en producción.
7. En reservas, conservar el dato seleccionado durante el cierre del sheet. El botón “Editar” cancela su acción predeterminada para evitar un submit accidental si React reutiliza el botón del footer al cambiar a edición.

No hay Server Actions ni conexión de las demás pantallas a las APIs financieras. El layout obtiene la sesión Auth0 en servidor y el encabezado/drawer muestran el perfil; el drawer ofrece cierre de sesión mediante `/auth/logout`. En `/`, una sesión real reemplaza el dashboard mock por alta/listado de cuentas persistidas y permite corregir el nombre sin cambiar saldo, tipo ni moneda. `GET /api/me`, `GET/POST /api/accounts`, `PATCH /api/accounts/[accountId]` y `POST /api/ledger-transactions` resuelven una sesión Auth0 verificada al propietario local antes de invocar repositorios. `FinanceProvider` adapta los saldos mock actuales al FinancialEngine; no inventa entradas históricas y conserva las transacciones heredadas únicamente para planificación y presentación. La capa PostgreSQL sigue desconectada de las demás vistas mock; ver [postgresql-schema.md](postgresql-schema.md) y [authentication.md](authentication.md).
