# Historial de trabajo

Este archivo registra entregas; no supone que todos los cambios estén commiteados. La funcionalidad vigente se consulta desde [el índice](README.md).

## Base del proyecto

- Commit `81c7277`: prototipo frontend de Inventario Personal de Finanzas.
- Commit `9613795`: refuerzo de archivos ignorados.
- Base inspeccionada: App Router, design system, navegación responsive, modelo central, escenarios mock, Dashboard, Hasta mi pago, Movimientos, Quick Add, Simulador, Ahorro y Configuración; Plan parcial y módulos futuros placeholder.
- El README conserva los ajustes a ejemplos de la especificación y QA visual/ad hoc de esa base; no se reconstruye una cronología anterior que no esté verificada.

## 2026-09-16 — implementación P1

- DASH-03: hero matemáticamente explicable, colchón y cálculo expandible con privacidad.
- DASH-11: distribución visual del ingreso; ahorro automático pendiente por ausencia de regla.
- PLAN-01: administración en memoria de presupuestos, reservas y recurrencias existentes.
- FORM-01: disabled/loading compartidos y prevención de doble envío.
- STATE-03: errores reutilizables y reintento; demo de error de datos protegido en producción.
- A11Y-05: token de borde de control claro/oscuro y hover legible.
- PERF-01: Inter variable local y licencia; sin dependencia de Google Fonts en build.
- QA-01: Playwright como único framework; 10 pruebas correctas, typecheck/build correctos.
- Se corrigió además un submit accidental al pasar de detalle a edición de reserva, detectado al probar Plan.
- Sin cambios de navegación general, backend o P2/P3.

Evidencia, archivos y componentes: [P1-implementation-report.md](P1-implementation-report.md).

## 2026-09-16 — memoria documental

- Índice breve y lectura selectiva por tarea.
- Documentos de arquitectura, modelo, pantallas/flujos, desarrollo/pruebas y pendientes.
- README principal enlaza al apartado de docs.
- AGENTS.md orienta las próximas sesiones al índice y pide mantener la memoria, sin eliminar las reglas generadas de Next.js.
- Reporte P1 conservado como entrega histórica y enlazado al contexto actual.
- Solo documentación/instrucciones locales: no cambios al comportamiento de la app, dependencias ni navegación.
- Verificación documental: enlaces locales, codificación UTF-8 y `git diff --check` correctos. No se repitieron pruebas funcionales para este cambio de documentación.

## 2026-09-17 — FinancialEngine v1

- Añadido dominio TypeScript puro para dinero en unidades menores `bigint`, conversiones con tasa de ocho decimales y redondeo sobre el importe final.
- Añadido ledger confirmado de doble entrada, reconciliación contra caché de saldo y detección de *drift*.
- Añadidas reglas puras de dinero libre, reserva por ingreso personal neto de compensación, fondos `EARMARKED` y proyección de eventos planificados.
- Pruebas de lógica con Playwright para transferencia, saldo libre, drift, balanceo del ledger, conversión, ahorro, earmark y proyección.
- Sin persistencia, API, autenticación ni conexión de la UI mock al motor nuevo.
- Verificación: `npm run typecheck` y 7/7 pruebas del motor correctas; `npm test` quedó parcialmente bloqueado en 7 pruebas de interfaz porque falta el ejecutable Chromium local de Playwright. Detalle en `development-and-testing.md`.

## 2026-09-17 — integración del FinancialEngine

- Añadido adaptador de `FinanceState` al motor y prueba de paridad para todos los escenarios mock.
- `getSnapshot()` obtiene saldo operativo, protecciones, dinero libre, gastable y proyección desde el FinancialEngine; Dashboard, Hasta mi pago y Simulador siguen leyendo el snapshot compartido sin rediseño visual.
- El adaptador usa saldos mock actuales como apertura y mantiene transacciones heredadas fuera del ledger, exclusivamente para planificación/presentación, para no duplicar historial demo.
- Documentado el diseño PostgreSQL de ledger, planificación, reservas, auditoría, restricciones, índices y reconciliación; no se crearon migraciones ni backend.
- Instalado Chromium de Playwright. Verificación: typecheck, build y 18/18 pruebas correctas.

## 2026-09-17 — persistencia PostgreSQL preparada

- Añadidos Drizzle ORM, `node-postgres`, scripts de esquema y `.env.example` sin secretos.
- Añadidos esquema tipado, migración inicial PostgreSQL y validaciones de base para propiedad de entradas y balanceo diferido del ledger antes de commit.
- Añadidos cliente server-only y repositorio transaccional idempotente para publicar hechos ledger, actualizar cachés y registrar evento/auditoría.
- La tasa de cambio quedó obligatoria y verificable para toda entrada ledger no NIO.
- Verificación: typecheck, `drizzle-kit check`, build y 19/19 pruebas correctas. No se aplicaron migraciones porque no hay `DATABASE_URL`; no se implementaron API ni autenticación.

## 2026-09-17 — PostgreSQL local verificado

- Añadido `compose.yaml` con PostgreSQL 16, volumen persistente y health check para desarrollo local reproducible.
- Aplicada la migración inicial a la instancia local mediante una variable `DATABASE_URL` temporal.
- Verificados los triggers del ledger contra PostgreSQL: asiento balanceado aceptado y asiento desbalanceado rechazado antes de commit; las comprobaciones se revirtieron sin conservar datos.
- Sin API ni autenticación: la base sigue aislada de la UI mock hasta resolver identidad y casos de uso HTTP.

## 2026-09-17 — base de autenticación Auth0

- Instalado `@auth0/nextjs-auth0` v4 y añadido el cliente server-only, `src/proxy.ts` y las variables de entorno de ejemplo sin secretos.
- Las páginas requieren sesión cuando Auth0 está configurado; producción falla cerrada con `503` si falta configuración. Las APIs deben autorizar en su propio handler.
- Añadido `users.auth0_subject` único, migración aditiva para usuarios heredados y repositorio que convierte una identidad Auth0 con correo verificado en propietario local.
- Añadido `GET /api/me` como referencia de autorización: no acepta `userId` del cliente y devuelve 401/403/409/503 según el caso.
- Aplicada `0001_petite_chameleon.sql` a PostgreSQL local. Verificación: typecheck, `drizzle-kit check`, 19/19 pruebas Playwright, build y respuesta `503` de `/api/me` sin secretos correctos. No se verificó login real por ausencia de credenciales Auth0.

## 2026-09-17 — API financiera inicial

- Añadidos `GET/POST /api/accounts` y `POST /api/ledger-transactions`; ambas rutas resuelven el propietario por sesión y no aceptan `userId` desde el cliente.
- Añadido parser estructurado de JSON: UUID, fecha real, importes decimales exactos, USD con tasa obligatoria y máximo de veinte entradas. El identificador de transacción se genera en servidor.
- Las aperturas USD se convierten en servidor; el FinancialEngine y PostgreSQL siguen comprobando el balanceo, la tasa y la propiedad de cuenta.
- Añadido manejo explícito para cuenta duplicada y referencias de cuentas ajenas, más tres pruebas del contrato HTTP. Verificación: typecheck, 22/22 pruebas Playwright y build correctos. Las llamadas anónimas devolvieron `503` sin Auth0; no hubo prueba de integración autenticada real.

## 2026-09-17 — sesión visible

- El layout servidor obtiene la sesión Auth0 y entrega sólo datos de presentación al contexto cliente; el encabezado, avatar y menú dejaron de usar el perfil mock durante una sesión real.
- Añadido enlace visible **Cerrar sesión** en el menú de cuenta, sin prefetch, hacia `/auth/logout`.
- Verificación manual: login Google, `GET /api/me` y usuario local creado. Verificación automatizada: typecheck y build correctos con Auth0 configurado. La suite Playwright existente requiere una estrategia de sesión de prueba antes de repetirse con el proxy activo.

## 2026-09-17 — onboarding de cuentas reales

- El inicio autenticado consulta las cuentas del usuario y ya no presenta cifras del dashboard mock cuando existen datos persistidos.
- Sin cuentas, muestra el formulario de alta para cuenta operativa o ahorro en NIO/USD; la API sigue siendo responsable de la conversión USD y de asociar la cuenta al usuario de sesión.
- Con cuentas, presenta sus saldos persistidos y permite agregar otra sin mezclar totalizadores financieros demo.
- Corregida la frontera del importe inicial: el separador de miles de la interfaz se elimina antes del `POST`, de forma que `1,000.00` conserva exactitud y llega como `1000.00` a la validación estricta de la API.
- Las cuentas con el mismo nombre activo devuelven el conflicto `409` previsto aunque Drizzle envuelva el error único de PostgreSQL; la UI maneja además respuestas sin JSON de manera comprensible.
- Verificación: typecheck, pruebas puntuales Playwright (5/5) y build correctos con Auth0 configurado. El alta manual y la automatización autenticada quedan pendientes.

## 2026-09-17 — corrección de cuentas reales

- Añadido `PATCH /api/accounts/[accountId]`, autorizado por propietario, que permite sólo cambiar el nombre y conserva saldo, moneda y tipo.
- Cada cuenta persistida presenta un control de edición accesible que abre un sheet con validación, estado de envío y el mismo manejo de conflictos de nombre duplicado.
- Verificación: typecheck, 5/5 pruebas de contrato financiero y build correctos. Falta comprobación manual de la edición autenticada.
