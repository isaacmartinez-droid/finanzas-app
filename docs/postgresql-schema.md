# Diseño PostgreSQL del dominio financiero

Este documento define la persistencia para el FinancialEngine v1. La fuente de reglas es el motor en [`src/domain/financial-engine/`](../src/domain/financial-engine/); el esquema persiste hechos y configuración, no resúmenes derivados.

## Implementación actual

- [`src/db/schema.ts`](../src/db/schema.ts) declara las tablas, enums, claves foráneas, checks e índices con Drizzle.
- [`drizzle/0000_initial_financial_ledger.sql`](../drizzle/0000_initial_financial_ledger.sql) es la migración inicial versionada. Incluye triggers para igualdad de usuario en las entradas y balanceo diferido de transacciones `posted` antes del commit.
- [`src/db/client.ts`](../src/db/client.ts) crea la conexión `node-postgres` sólo en servidor y exige `DATABASE_URL`.
- [`src/db/repositories/ledger-repository.ts`](../src/db/repositories/ledger-repository.ts) persiste el ledger, cachés, evento financiero y auditoría en una sola transacción idempotente por `(user_id, operation_id)`.
- [`drizzle/0001_petite_chameleon.sql`](../drizzle/0001_petite_chameleon.sql) añade `users.auth0_subject`, la identidad única e inmutable que vincula Auth0 con la propiedad financiera local.
- [`src/db/repositories/user-repository.ts`](../src/db/repositories/user-repository.ts) resuelve o crea el usuario interno desde una identidad Auth0 con correo verificado; no acepta `user_id` del cliente.
- [`src/db/repositories/account-repository.ts`](../src/db/repositories/account-repository.ts) crea y lista únicamente cuentas del propietario autenticado.
- [`src/app/api/accounts/route.ts`](../src/app/api/accounts/route.ts) y [`src/app/api/ledger-transactions/route.ts`](../src/app/api/ledger-transactions/route.ts) son la frontera HTTP protegida para cuentas y hechos contables.
- [`src/features/accounts/PersistedAccountsDashboard.tsx`](../src/features/accounts/PersistedAccountsDashboard.tsx) consume la API de cuentas durante el onboarding autenticado; el saldo USD base siempre se calcula en servidor.
- Las migraciones `0000` y `0001` se aplicaron y verificaron contra PostgreSQL 16 local mediante [`compose.yaml`](../compose.yaml). La URL se usó sólo como variable temporal de terminal, no se guardó en el repositorio ni se conectó a la UI.

## Convenciones

- PK: `uuid`; todo dato de negocio pertenece a `user_id`.
- Fechas de dominio: `date`; `created_at` y `updated_at`: `timestamptz` UTC.
- Importe original/base: `numeric(18,2)`. Tasa: `numeric(18,8)`. Moneda base inicial: `NIO`.
- Los importes monetarios son positivos cuando describen una magnitud. La dirección del ledger vive en `ledger_entries.amount_original` y `amount_base`, que son firmados.
- Las entradas publicadas no se editan. Una corrección se expresa con otra transacción que referencia `reversal_of_transaction_id` o con una transacción de ajuste.

## Tablas esenciales

| Tabla | Campos principales | Regla |
| --- | --- | --- |
| `users` | `id`, `auth0_subject`, correo, nombre, `base_currency`, `timezone` | `auth0_subject` es único y enlaza la identidad externa al propietario local; `base_currency = 'NIO'` inicialmente. |
| `accounts` | `id`, `user_id`, nombre, `kind`, `currency`, `opening_balance`, `opening_balance_base`, `current_balance`, `current_balance_base` | `current_*` son caché reconciliable, no fuente de verdad. |
| `ledger_transactions` | `id`, `user_id`, `occurred_on`, `status`, `reversal_of_transaction_id`, `operation_id`, metadatos | Sólo hechos `posted`; `voided` no afecta saldos. |
| `ledger_entries` | `id`, `transaction_id`, `account_id`, `amount_original`, `currency`, `amount_base`, `exchange_rate` | La suma de `amount_base` de una transacción publicada debe ser cero. |
| `balance_adjustments` | `id`, `user_id`, `account_id`, `transaction_id`, motivo | Es metadato de una transacción ledger; nunca una segunda suma fuera del ledger. |
| `reservations` | `id`, `user_id`, `account_id`, importe base, propósito, `status` | Sólo `active` protege dinero libre. |
| `reservation_activities` | `id`, `reservation_id`, tipo, monto, `operation_id` | Audita creación, ajuste, liberación y consumo. |
| `obligations` | `id`, `user_id`, importe base, vencimiento, `funding_status` | Sólo `unfunded` entra en `ProtectedCurrentFunds`. |
| `recurring_rules` | `id`, `user_id`, cadencia, plantilla, `active` | Genera planificación, nunca ledger directamente. |
| `recurring_occurrences` | `id`, `rule_id`, fecha, estado, importe esperado | Al suceder enlaza opcionalmente a `ledger_transaction_id`. |
| `planned_financial_events` | `id`, `user_id`, fecha, tipo, importe base, estado | Para ingresos/gastos previstos no recurrentes. |
| `income_rules` | `id`, `user_id`, `fixed_saving_amount`, `active` | Regla de C$1,000 versionable. |
| `income_allocations` | `id`, `income_transaction_id`, bruto, compensación, neto, reservado, faltante, propósito | Conserva el resultado de aplicar la regla al recibo real. |
| `financial_events` | `id`, `user_id`, tipo, fecha, `operation_id`, contenido explicable | Timeline y “Qué cambió hoy”. |
| `audit_logs` | `id`, actor, entidad, antes/después, `operation_id` | Trazabilidad técnica; no depende de `financial_events`. |

## Restricciones e índices

```text
UNIQUE (user_id, normalized_name)                 ON accounts WHERE archived_at IS NULL
UNIQUE (transaction_id, account_id, sequence_no)  ON ledger_entries
UNIQUE (recurring_rule_id, occurs_on)             ON recurring_occurrences
CHECK (amount_original <> 0)
CHECK (exchange_rate > 0)
CHECK (currency IN ('NIO', 'USD'))
CHECK (status IN ('posted', 'voided'))
```

Un trigger diferido o una operación transaccional de repositorio valida que `SUM(ledger_entries.amount_base) = 0` antes de confirmar una `ledger_transaction` publicada. El mismo caso de uso escribe entradas, reserva/asignación, `financial_event`, auditoría y cachés de cuenta de forma atómica e idempotente mediante `operation_id`.

## Frontera HTTP inicial

- `GET /api/accounts` lista sólo las cuentas del propietario de la sesión. `POST /api/accounts` acepta `name`, `kind`, `currency`, `openingBalance` y, sólo para USD, `exchangeRate`. `PATCH /api/accounts/[accountId]` sólo permite corregir `name`, con propiedad comprobada por el `user_id` de sesión.
- `POST /api/ledger-transactions` acepta `operationId`, `occurredOn` y entre dos y veinte entradas. El servidor crea el identificador de la transacción y no acepta un `userId` desde el cliente.
- Todos los importes y tasas son strings decimales. Las cuentas USD calculan su apertura base en servidor; las entradas USD deben traer importe base y tasa, que el FinancialEngine vuelve a verificar exactamente. NIO no acepta tasa de cambio. La UI elimina los separadores de miles de `MoneyInput` antes de enviar el importe canónico, mientras la API conserva su validación decimal estricta.
- `operationId` es UUID y aplica la idempotencia existente. Una repetición devuelve el mismo `transactionId` con `created: false`.
- Las rutas devuelven `401` sin sesión, `403` si el correo no está verificado, `409` para nombre de cuenta activo duplicado y `422` para contrato o ledger inválido. El repositorio reconoce la violación única `23505` incluso cuando Drizzle la envuelve; el cliente trata de forma segura respuestas vacías o no JSON. Sin configuración Auth0 devuelven `503`.
- El inicio autenticado carga esas cuentas por `GET /api/accounts`; si la lista está vacía muestra el formulario de alta y, si ya existen, sólo muestra sus saldos persistidos. Cada tarjeta permite corregir el nombre en un sheet; no combina esa vista con agregados mock.

Índices iniciales:

```text
ledger_transactions (user_id, occurred_on DESC) WHERE status = 'posted'
ledger_entries (account_id, transaction_id)
reservations (user_id, status, account_id) WHERE status = 'active'
obligations (user_id, funding_status, due_date) WHERE funding_status = 'unfunded'
planned_financial_events (user_id, occurs_on) WHERE status IN ('expected', 'scheduled')
financial_events (user_id, occurred_on DESC)
audit_logs (operation_id)
```

## Reconciliación

Para cada cuenta, el repositorio calcula:

```text
opening_balance + SUM(ledger entries posted) = calculated_balance
calculated_balance - accounts.current_balance = drift
```

Un trabajo de mantenimiento puede ejecutar `recalculateAccountBalance(accountId)`, actualizar la caché y crear un `financial_event`/`audit_log` cuando encuentre drift. No debe corregir una diferencia silenciosamente ni modificar entradas históricas.

## Límites de esta entrega

La siguiente entrega debe conectar los casos de uso de pantalla a estas APIs y añadir pruebas de integración contra PostgreSQL y Auth0 reales. El motor actual conserva `amount_base` al tipo de cambio del hecho; una futura revaluación de saldos en divisa exige asientos explícitos, no recalcular silenciosamente el historial.
