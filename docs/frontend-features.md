# Pantallas y flujos implementados

Inventario funcional del prototipo actual. Las limitaciones están en [pending.md](pending.md); las fórmulas, en [financial-model.md](financial-model.md).

## Rutas y navegación

| Ruta | Vista / estado |
| --- | --- |
| `/` | `DashboardView`, funcional. |
| `/hasta-mi-pago` | `CashFlowView`, funcional. |
| `/movimientos` | `TransactionsView`, funcional. |
| `/simulador` | `SimulatorView`, funcional; no es un tab de navegación. |
| `/plan` | `PlanView`, MVP en memoria para reservas, presupuestos y recurrencias. |
| `/ahorro` | `SavingsView`, funcional. |
| `/configuracion` | `SettingsView`, preferencias y demo. |
| `/deudas`, `/reportes` | Placeholders; no módulos completos. |

[nav-items.ts](../src/components/navigation/nav-items.ts) define navegación/títulos. Mobile (<768 px): barra inferior y botón +. Tablet (768–1023): rail de 72 px. Desktop (≥1024): sidebar de 220/72 px. No se cambió este esquema en P1.

## Inicio

[DashboardView.tsx](../src/features/dashboard/DashboardView.tsx):

- Hero “Puedes gastar hoy”, estado canónico, días hasta pago y faltante cuando corresponde.
- Resumen de operativo, reservado, comprometido y colchón. `DashboardCalculationPreview` expande/oculta el desglose mediante “Ver cálculo”, sin navegar ni duplicar la fórmula.
- Acciones Gastar, Ingresar, Reservar y Simular; alerta financiera enlazada a Hasta mi pago.
- Próximo ingreso esperado, timeline compacto, meta/ahorro y últimos movimientos con detalle.
- “¿Qué cambió hoy?” explica cambios desde ayer.
- `IncomeAllocationCard` aparece si existe un ingreso recibido. Ahorro automático sigue sin configuración; no se deduce la reserva mock existente del último ingreso.
- Skeleton al cambiar escenario y error de datos recuperable.

## Hasta mi pago

[CashFlowView.tsx](../src/features/cash-flow/CashFlowView.tsx): hero compartido, resumen, desglose interactivo con `BreakdownDetailSheet`, ritmo recomendado, proyección antes del pago, timeline de próximos eventos y cambios del día. Incluye detalle de movimientos; no es un calendario completo ni una vista nueva de Deudas.

## Movimientos

[TransactionsView.tsx](../src/features/transactions/TransactionsView.tsx):

- Lista agrupada en móvil/tablet y tabla en desktop.
- Búsqueda por concepto, categoría y cuenta, normalizada para ignorar acentos/mayúsculas.
- Chips de tipo y filtros de período, categoría, cuenta, estado y moneda en `FiltersSheet`.
- Grupo de reservas incluye transferencias; categoría Comida incluye supermercado.
- Estados vacíos y error/reintento. Los filtros/búsqueda se conservan al representar el error.
- `TransactionDetailSheet`: concepto completo, importe, fecha, cuentas, tipo, categoría, recurrencia, desglose y nota si existen.
- Ingreso esperado: “Marcar como recibido”. Gasto programado recurrente: “Omitir esta vez”. No hay edición/eliminación general de todos los movimientos.

## Quick Add y formularios

[QuickAddSheet.tsx](../src/features/quick-add/QuickAddSheet.tsx) abre registro de gasto, ingreso, reserva, transferencia o Simulador. [TransactionFormSheet.tsx](../src/features/quick-add/TransactionFormSheet.tsx) reutiliza un formulario por modo y admite prefill contextual.

- Gastos/ingresos: moneda NIO/USD, monto, concepto, categoría y cuenta operativa.
- Reservas: nombre, importe NIO y cuenta operativa. Se advierte si se supera el dinero libre; no se transfiere saldo.
- Transferencias: importe NIO, cuenta origen/destino y explicación del impacto.
- Monto positivo y concepto requerido donde aplica; gasto/transferencia no puede superar el saldo de la cuenta elegida desde la UI.
- Validación inline, foco en el campo de monto inválido, feedback por toast y cierre al registrar.
- Envíos de estado en memoria son síncronos: el sheet puede cerrar inmediatamente. Loading/disabled bloquean duplicados sin añadir una espera artificial.

No existe un formulario de programación completa de pagos ni un creador de series recurrentes nuevas.

## Simulador

[SimulatorView.tsx](../src/features/simulator/SimulatorView.tsx) abre con un borrador mock ya evaluado. Permite monto/moneda, concepto, cuenta y tipo de gasto personal, compartido o mantenimiento.

- Estados Seguro, Posible pero ajustado y No recomendado; margen posterior, protecciones y cuenta insuficiente.
- Feedback de carga, botón estable y campos bloqueados durante la simulación.
- Error/reintento conserva el borrador; el demo de fallos permite reproducirlo.
- Alternativas contextuales: pagar todo/dividir 50-50/ingresar parte propia en compartidos; otras opciones según el tipo.
- Registrar gasto o reservar abre el formulario con prefill. Simular por sí solo no registra movimientos.
- “Posponer al salario” calcula contexto y muestra un toast; no existe un recordatorio persistente ni servicio de notificaciones.

## Plan y Ahorro

[PlanView.tsx](../src/features/plan/PlanView.tsx) mantiene sus tabs y hash inicial:

- **Reservas:** crear desde formulario existente; `ReserveDetailSheet` permite detalle, editar nombre/monto/cuenta y liberar. Presenta el impacto financiero. Liberar no borra movimientos históricos.
- **Presupuestos:** crear/editar/eliminar límite por categoría del ciclo actual. Muestra gasto acumulado/progreso; impide la misma categoría duplicada. No aparta saldo ni aplica un bloqueo automático de compras.
- **Recurrencias:** administrar series existentes: frecuencia, pausa y reanudación. Pausar retira próximas ocurrencias de las proyecciones. No se generan fechas nuevas ni un calendario.
- **Aportes/Calendario:** permanecen futuros, sin completar funcionalidad P2/P3.
- Error de datos/reintento disponible en desarrollo/test.

[SavingsView.tsx](../src/features/savings/SavingsView.tsx) muestra meta, ahorro protegido, cuentas de ahorro y reservas con propósito de ahorro. Reutiliza `ReserveDetailSheet`; transferir abre el formulario global. Incluye error/reintento.

## Configuración, accesibilidad y estados

[SettingsView.tsx](../src/features/settings/SettingsView.tsx) y menú de cuenta: tema claro/oscuro/sistema, privacidad, escenarios, carga lenta y error del simulador. El error de vistas de datos se puede activar solo en desarrollo/test. Las reglas financieras se muestran; no hay editor funcional general de reglas.

Design system conservado: labels persistentes, foco visible, enlace para saltar al contenido, sheets por teclado, contraste de bordes mediante `--control-border`, estados no dependientes solo del color y reducción de movimiento. `MoneyValue` responde a `html[data-privacy]`; no asumir que texto numérico escrito fuera de ese componente quede oculto.

`AsyncErrorState` acepta título, descripción, icono consistente y reintento; usa `role="alert"` y región viva accesible. Integrado en Inicio, Movimientos, Ahorro, Plan y resultado del Simulador. Representa un estado frontend, no fallos de una API real.
