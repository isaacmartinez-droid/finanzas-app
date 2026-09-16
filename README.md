# Inventario — Finanzas personales (prototipo frontend)

Prototipo navegable, **solo frontend**, construido alrededor de una pregunta:

> ¿Cuánto puedo gastar hoy sin perjudicar mis obligaciones, mi ahorro ni mi estabilidad?

Todo funciona con **datos simulados en memoria**. No hay backend, API, base de datos, autenticación ni persistencia (solo `localStorage` para tema, privacidad y ancho del menú).

## Documentación del proyecto

Consulta [docs/README.md](docs/README.md) para retomar el trabajo: contexto breve, arquitectura, modelo financiero, funcionalidades, pruebas, historial y pendientes. Lee el índice y solo el documento relacionado con tu tarea; no es necesario reconstruir conversaciones anteriores.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción (todas las rutas son estáticas)
npm run typecheck
```

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Lucide. Sin otras dependencias de runtime.

Inter se sirve desde `src/app/fonts/InterVariable.woff2` con `next/font/local` (licencia incluida). El build no descarga fuentes de Google Fonts.

## Pruebas reproducibles

```bash
npm ci
npx playwright install chromium   # solo la primera vez; necesita descargar el navegador
npm test
npm run typecheck
npm run build
```

Playwright es la única dependencia nueva de desarrollo. `npm test` inicia automáticamente el servidor en `127.0.0.1:3100`. Cubre el modelo financiero, Dashboard/privacidad, Quick Add/Escape/foco, estados del simulador, anchos 320/375/768/1366 y administración de Plan.

Si ya tienes `npm run dev` abierto en el puerto 3000, puedes reutilizarlo en PowerShell con `$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3000'` antes de ejecutar `npm test`, o cerrar ese servidor antes de las pruebas. Usa el mismo hostname del servidor para respetar la protección de origen de Next.js.

## Pantallas

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio — "Puedes gastar hoy" |
| `/hasta-mi-pago` | Hasta mi pago — cálculo, ritmo, proyección, timeline |
| `/movimientos` | Movimientos — lista (móvil/tablet) → tabla (escritorio) |
| `/simulador` | ¿Puedo gastar esto? (no es un tab; se abre con **+**, "Simular" o botones contextuales) |
| `/plan` | Presupuestos por categoría/ciclo, gestión de reservas y administración básica de recurrencias |
| `/ahorro`, `/configuracion` | Ahorro y ajustes/escenarios de demo |
| `/deudas`, `/reportes` | Placeholders |

Navegación: barra inferior + botón **+** (<768 px) · rail de 72 px (768–1023 px) · sidebar de 220/72 px (≥1024 px).

## Arquitectura

```
src/
  app/                 rutas (páginas delgadas) + layout y providers
  components/
    ui/                design system: Button, IconButton, Input, MoneyInput, Select,
                       SegmentedControl, Tabs/ChipGroup, Badge, Card, Sheet (BottomSheet/
                       Drawer/Modal), Accordion, Progress, Skeleton, EmptyState, AsyncErrorState, Alert, Switch
    financial/         MoneyValue, FinancialStatusBadge, AvailableMoneyHero, FinancialSummary,
                       QuickActions, FinancialAlert, UpcomingIncomeCard, ProjectionCard,
                       FinancialTimeline, TransactionItem, TransactionTable, SavingsCard,
                       ReserveCard, ProtectionList, SimulationInput, SimulationResult,
                       DecisionAlternatives, CashFlowBreakdown, DashboardCalculationPreview,
                       IncomeAllocationCard, WhatChangedCard, PaceCard
    navigation/        AppShell, header, bottom nav, rail, sidebar
  features/            vistas por dominio (dashboard, cash-flow, transactions, simulator, …)
  hooks/               estado en memoria (use-finance), preferencias, toasts, overlays
  lib/                 motor financiero (finance.ts), formato, fechas, categorías
  mocks/               datos crudos por dominio + escenarios
  types/               tipos del dominio
  styles/globals.css   design tokens (light/dark) y utilidades
```

**Punto de conexión con una API futura:** los mocks representan lo que devolvería el backend (`FinanceState`). Todas las cifras derivadas salen de `getSnapshot()` en [src/lib/finance.ts](src/lib/finance.ts); los componentes solo reciben props. Para conectar datos reales basta con reemplazar la carga en [src/hooks/use-finance.tsx](src/hooks/use-finance.tsx).

## Modelo financiero

```
Dinero libre = Saldo operativo − Reservado − Comprometido − Colchón
             = 3,082.21 − 600 − 0 − 1,000 = C$1,482.21
```

- El hero muestra `max(0, dinero libre)`, así que **nunca supera el saldo operativo**, y los ingresos futuros nunca cuentan.
- **Estado canónico** (una sola función, `computeStatus`, que usan todas las pantallas):
  - **Déficit**: reservas + compromisos > saldo operativo.
  - **En riesgo**: el dinero libre es negativo (se tocaría el colchón).
  - **Ajustado**: el dinero libre es menor que el gasto cómodo (C$150/día × días restantes).
  - **Cómodo**: en cualquier otro caso.
- **Ritmo recomendado**: se reparte el 60 % (Cómodo) o el 40 % (Ajustado) del dinero libre entre los días restantes, redondeado a C$10. En el escenario base: 1,482.21 × 40 % ÷ 12 ≈ **C$50/día**, y se conservan C$882.21 como margen.
- **Proyección** (antes del salario): dinero libre + ingresos esperados − gastos programados − gasto al ritmo recomendado.
- **Simulador**: aplica la misma función de estado al margen que queda tras la compra (Cómodo → *Seguro*, Ajustado → *Posible, pero ajustado*, En riesgo/Déficit → *No recomendado*). Si falta dinero, primero se usa el colchón, luego las reservas y después los compromisos, y así lo reporta la lista de protecciones.

## Ajustes a los mocks de la especificación

La especificación pide que, si un ejemplo no cuadra con el cálculo, **se ajusten los mocks** (§85). Estos son los cambios:

| Ejemplo en la especificación | En el prototipo | Motivo |
| --- | --- | --- |
| Timeline: "Saldo operativo actual C$1,141" | C$3,082.21 | Debe coincidir con el saldo operativo del resumen. |
| "C$1,000 reservados pendientes de transferir" / "Ahorro reservado −C$1,000" | C$600 | Lo reservado total es C$600; esa reserva es el ahorro por transferir. |
| Protección "Comida reservada C$1,000" | "Ahorro por transferir C$600" | La comida de esta semana se omitió y su reserva se liberó: ese es el +C$1,000 de "¿Qué cambió hoy?". |
| Supermercado "Hoy" | "Ayer" (14 Sep) | Si fuera hoy, el cambio neto sería +C$275 y no +C$700. |
| Alerta "C$320 adicionales de margen" | "≈C$123 por día… lo cómodo sería C$150" | Texto derivado del cálculo real. |
| Proyección al 27 Sep "C$3,200" | ≈C$2,482.21 | 1,482.21 + 2,600 − 1,000 (comida del 22 Sep) − 600 (ritmo). |
| Salario ≈ C$6,409 y C$1,100 ≈ US$30.05 | Tipo de cambio 36.6243 → ≈ C$6,409 y ≈ US$30.03 | Un solo tipo de cambio no puede producir ambas cifras. |
| Resultado "Seguro · margen C$1,850" | Visible en el escenario **Cómodo** | En el escenario base el margen no puede superar C$1,482.21. |

## Escenarios y estados de demostración

Desde el avatar o **Configuración**:

- **Escenarios**: Cómodo · Ajustado (base) · En riesgo · Déficit · Montos grandes (millones, para revisar que el hero no se trunque).
- **Carga lenta**: alarga los skeletons al cambiar de escenario.
- **Fallar el simulador**: muestra el estado de error sin borrar lo que escribiste.
- **Fallar vistas de datos** (solo desarrollo): permite probar `AsyncErrorState` y el reintento en Inicio, Movimientos, Ahorro y Plan. No se puede activar en producción.

También puedes registrar gastos, ingresos, reservas y transferencias; marcar un ingreso esperado como recibido y omitir una recurrencia. Cada acción recalcula todas las pantallas en memoria.

En Plan puedes crear/editar/eliminar límites de presupuesto por categoría para el ciclo actual, editar/liberar reservas y cambiar la frecuencia o pausar/reanudar recurrencias existentes. Los presupuestos no separan dinero ni alteran el dinero libre. Aportes y Calendario siguen siendo secciones futuras.

**Pendiente P1 — DASH-11:** `IncomeAllocationCard` muestra el último ingreso recibido, el flujo y el remanente, pero el modelo no define ninguna regla de ahorro automático ni su vínculo con ese ingreso. Se indica **“No configurado”** y no se aplica un monto o porcentaje inventado. Para cerrar ese paso hace falta definir la regla financiera; no requiere añadir backend en esta iteración.

Reporte de cambios y verificaciones: [docs/P1-implementation-report.md](docs/P1-implementation-report.md).

## Accesibilidad y decisiones de diseño

- Objetivo WCAG 2.2 AA: navegación por teclado, foco visible, enlace "Saltar al contenido", foco atrapado en los sheets (Escape cierra y el foco vuelve al disparador), labels persistentes, `inputmode="decimal"`, respeto a `prefers-reduced-motion`, y estados que nunca dependen solo del color (badge con texto y punto).
- **Modo oscuro**: en los botones rellenos se usa `#2563EB`, porque el texto blanco sobre `#3B82F6` da 3.7:1 (no cumple AA). `#3B82F6` se reserva para texto, iconos y foco.
- `#94A3B8` (texto terciario) da 2.6:1 sobre blanco, así que solo se usa en placeholders y elementos decorativos, nunca en información financiera.
- **Privacidad**: el ojo aplica `html[data-privacy]` antes del primer render. Todos los importes pasan por `<MoneyValue>`, que muestra `C$ ••••••` sin parpadeo, y las etiquetas no contienen montos.

## QA realizada

- Sin scroll horizontal en 320×568, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900 y 1920×1080, en todas las rutas.
- Revisión visual en 390, 768 y 1440 px, en modo claro y oscuro.
- Flujos automatizados en Chrome headless: registro que recalcula el hero, validación inline, Escape, foco en los sheets, modo privado sin fugas, ningún tab activo en el simulador, el mismo estado en Inicio y Hasta mi pago en los 5 escenarios, hero sin truncar con millones y etiquetas del rail sin truncar.
