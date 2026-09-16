# Modelo financiero

Fuentes: [tipos](../src/types/finance.ts), [motor central](../src/lib/finance.ts), [reducer](../src/hooks/use-finance.tsx), [simulador](../src/features/simulator/simulate.ts). Los ejemplos son datos demo, no asesoría ni valores reales del usuario.

## Conceptos y fórmula

| Concepto | Origen y significado |
| --- | --- |
| Operativo | Suma de cuentas `kind: operational`. |
| Reservado | Suma de `state.reserves`; sigue dentro del operativo, pero ya tiene propósito. |
| Comprometido | Suma de `state.commitments`; no se sustituye por todos los gastos programados. |
| Colchón | `state.cushion`, mínimo protegido dentro del saldo operativo. |
| Ahorro protegido | Suma de cuentas `kind: savings`, fuera del saldo operativo. |
| Dinero libre | Resultado firmado del cálculo; puede ser negativo. |
| Gastable hoy | Valor del hero, limitado a la disponibilidad operativa en los escenarios actuales. |

```text
free = round2(operating - reserved - committed - cushion)
spendableToday = min(max(0, free), operating)
shortfall = round2(max(0, -free))
```

El ahorro protegido no se resta otra vez. No truncar `free` en el desglose: que el hero muestre cero no elimina el faltante.

Cuentas, reservas, presupuestos y compromisos usan NIO. Las transacciones/pago pueden ser NIO o USD. `exchangeRate` expresa NIO por USD; reutilizar `toNio()` y `round2()` de [format.ts](../src/lib/format.ts). Fechas de dominio: `YYYY-MM-DD`, no timestamps.

## Estado canónico y ritmo

Evaluación de `computeStatus()`, en este orden:

1. `operating < reserved + committed`: Déficit.
2. `free < 0`: En riesgo.
3. `free < comfortDailyTarget × daysRemaining`: Ajustado.
4. En otro caso: Cómodo.

`daysRemaining` y duración del ciclo tienen mínimo 1. `computePace()` reparte el 60% en Cómodo, 40% en Ajustado y 0% en riesgo/déficit. Redondea el importe diario a C$10 y lo ajusta si repartirlo superaría el disponible. El resto se conserva como margen.

## Proyección y cambios del día

- `isUpcoming()` acepta `expected/scheduled` salvo recurrencias con `active: false`.
- La proyección parte de `free`, añade ingresos y resta gastos con fecha estrictamente posterior a hoy y anterior al pago; luego descuenta el ritmo distribuible. No incluye el salario del día de pago en ese total.
- El timeline tiene otra ventana: realizados de hoy más próximos entre hoy y el pago, inclusive. No confundirlo con las líneas de la proyección.
- `netChange` suma `changesToday.delta`; `yesterdayFree = round2(free - netChange)`.
- `pendingSavingsTransfer` suma reservas con `purpose: savings`. Es dinero reservado, no ahorro ya transferido.

## Impacto de las acciones existentes

| Acción | Impacto |
| --- | --- |
| Registrar gasto pagado | Resta saldo de la cuenta operativa elegida, añade movimiento y cambio negativo. |
| Registrar ingreso recibido | Suma saldo operativo, añade movimiento y cambio positivo. |
| Marcar ingreso esperado recibido | Suma el ingreso a su cuenta y cambia estado/fecha a recibido/hoy. |
| Crear reserva | No mueve saldo; añade reserva, movimiento histórico y cambio negativo. |
| Editar reserva | Actualiza nombre/monto/cuenta; cambio de dinero libre = monto anterior − nuevo. |
| Liberar reserva | Quita la reserva y libera su importe; no transfiere dinero ni borra el historial. |
| Crear/editar/eliminar presupuesto | No cambia saldos, reservas ni dinero libre. |
| Transferir entre cuentas del mismo tipo | No cambia el operativo agregado ni el dinero libre. |
| Transferir operativo → ahorro | Reduce operativo/libre y aumenta ahorro protegido. Inversamente para ahorro → operativo. |
| Omitir una ocurrencia futura | Cambia su estado; no modifica el saldo actual. |
| Pausar/reanudar serie | Conserva movimientos/fechas; excluye/incluye ocurrencias en la proyección mediante `isUpcoming()`. |

Una transferencia no consume automáticamente una reserva; no asumir ese vínculo. Editar/liberar reservas conserva las transacciones históricas. Las validaciones de UI no constituyen un backend ni garantizan cualquier estado arbitrario introducido fuera de esos flujos.

## Presupuestos

Límite positivo elegido por el usuario para una categoría durante el ciclo actual. `budgetSpent()` suma gastos `paid` entre `cycleStart` y `today`, inclusive, convertidos a NIO. “Comida” incluye `groceries`, igual que el filtro existente. La UI impide duplicar la misma categoría. No existe histórico de presupuestos por ciclo, rollover ni aplicación automática de límites.

## Simulador e ingreso

`simulatePurchase()` es puro: resta la compra a libre/operativo y usa `computeStatus()`. Cómodo → Seguro; Ajustado → Posible, pero ajustado; riesgo/déficit → No recomendado. Saldo insuficiente en la cuenta elegida también fuerza No recomendado. Si se agotan protecciones: colchón, reservas y compromisos, en ese orden; ahorro protegido separado permanece intacto.

`lastReceivedIncome()` obtiene el último ingreso con estado `received`. `IncomeAllocationCard` convierte ese importe a NIO y presenta el flujo. El modelo no define ahorro automático; la integración no pasa una deducción y muestra “No configurado”. Ver [el bloqueo](pending.md).

## Mocks y escenarios

[dashboard.ts](../src/mocks/dashboard.ts) y [scenarios.ts](../src/mocks/scenarios.ts) construyen una copia nueva. Fecha demo fija: 2026-09-15; ciclo inicia 2026-09-12; pago 2026-09-27; cambio 36.6243; gasto cómodo C$150/día.

- `tight`, base: operativo C$3,082.21; reservas C$600; compromisos C$0; colchón C$1,000; libre C$1,482.21; ahorro C$2,100. Con 12 días: ritmo C$50/día y margen conservado C$882.21.
- `comfortable`: ingreso de papá adelantado; aumenta el saldo operativo en C$2,600.
- `risk`: reparación pagada y compromiso de C$700; se compromete el colchón.
- `deficit`: saldo reducido y compromisos por C$1,500; obligaciones superan el operativo.
- `extreme`: importes de millones para probar el layout, no otra regla financiera.

Los ajustes históricos de ejemplos de la especificación siguen registrados en [README.md](../README.md). No corregir datos aislados de una tarjeta: cambiar el estado y comprobar las pantallas dependientes.
