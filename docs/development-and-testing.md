# Desarrollo, pruebas y problemas conocidos

## Instalar y ejecutar

Ejecutar desde la carpeta que contiene [package.json](../package.json):

```powershell
npm ci
npm run dev
```

`npm ci` instala las versiones del lockfile; `npm install` también sirve para la instalación inicial, pero puede actualizar la resolución del lockfile. Se requiere Node/npm disponibles; comprobar con `node --version` y `npm --version`. Este repositorio no fija una versión de Node propia mediante `.nvmrc` o `engines`.

Servidor normal: `http://localhost:3000`. Para producción local:

```powershell
npm run build
npm start
```

No requiere `.env`, credenciales, servicios externos ni base de datos para el prototipo actual. No añadirlos para resolver un problema de instalación.

## PostgreSQL local

La capa de persistencia no se conecta al frontend mock. Para levantar una instancia local reproducible se requiere Docker Desktop en ejecución:

```powershell
docker compose up -d postgres
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/inventario'
npm run db:migrate
```

`compose.yaml` usa el volumen nombrado `inventario-postgres-data`; detener el servicio con `docker compose down` conserva los datos. Para abrir SQL: `docker compose exec postgres psql -U postgres -d inventario`. La URL sólo debe existir en variables locales o archivos ignorados, nunca en Git.

## Auth0 local

La demo mock sigue disponible durante desarrollo cuando no existen variables de Auth0. Para activar autenticación real, crear una Regular Web Application, configurar las URLs indicadas en [authentication.md](authentication.md) y copiar los valores en `.env.local`. Generar el secreto en PowerShell sin versionarlo:

```powershell
openssl rand -hex 32
```

Si OpenSSL no está instalado en Windows, generar el mismo secreto con .NET:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
```

Con Auth0 configurado, las páginas exigen sesión y el SDK monta `/auth/login`, `/auth/logout` y `/auth/callback`. `GET /api/me` requiere además `DATABASE_URL`; sin Auth0 responde `503`, sin sesión `401` y con correo no verificado `403`.

## Verificar cambios funcionales

```powershell
npx playwright install chromium  # primera instalación; requiere red
npm test
npm run typecheck
npm run build
git diff --check
```

Persistencia local, una vez que exista PostgreSQL y `DATABASE_URL`:

```powershell
npm run db:generate  # genera una migración al cambiar src/db/schema.ts
npm run db:check     # comprueba consistencia de metadatos Drizzle
npm run db:migrate   # aplica migraciones; requiere DATABASE_URL
```

Una sola herramienta de pruebas: `@playwright/test`, dependencia de desarrollo. No hay segundo framework. [playwright.config.ts](../playwright.config.ts) usa Chromium, reportes list/HTML y conserva screenshots/trazas al fallar. Ignorados: `playwright-report/` y `test-results/`.

Por defecto las pruebas arrancan un servidor en `127.0.0.1:3100`. Next impide otro `next dev` para el mismo directorio; si ya existe el servidor normal, reutilizarlo:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3000'
npm test
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

La variable indica el servidor existente, no cambia el comando de arranque del puerto 3100. Usa el hostname exacto que muestra el servidor: Next bloquea recursos de desarrollo desde orígenes no permitidos. No detener automáticamente un proceso ajeno ni modificar `allowedDevOrigins` solo para evitar esta protección.

## Cobertura versionada

| Archivo | Pruebas |
| --- | --- |
| [finance.spec.ts](../tests/finance.spec.ts) | Límite gastable en escenarios; reservas/compromisos/colchón; tres resultados de lógica del simulador. |
| [critical-ui.spec.ts](../tests/critical-ui.spec.ts) | Hero y cálculo, privacidad, Quick Add/cierre/Escape/retorno de foco, Dashboard a 320/375/768/1366 px sin desborde horizontal. |
| [plan.spec.ts](../tests/plan.spec.ts) | Editar/liberar reserva, crear/eliminar presupuesto y estado pausado de recurrencia. |
| [financial-engine.spec.ts](../tests/financial-engine.spec.ts) | Ledger, conversión, compensación, earmark y proyección, incluida tasa obligatoria para divisas. |
| [financial-engine-adapter.spec.ts](../tests/financial-engine-adapter.spec.ts) | Paridad entre escenarios mock y el adaptador al FinancialEngine. |
| [finance-api-request.spec.ts](../tests/finance-api-request.spec.ts) | Contrato HTTP: dinero exacto, apertura USD calculada en servidor, tasas inválidas, fechas y balanceo de ledger. |
| [money-input-boundary.spec.ts](../tests/money-input-boundary.spec.ts) | Normalización exacta del importe agrupado de `MoneyInput` antes del alta de cuenta. |

Las pruebas del simulador son de lógica, no un flujo completo de navegador. El test de recurrencia comprueba el estado visible pausado; no afirma probar toda la proyección. El responsive versionado cubre Dashboard, no todas las rutas/sheets. No existe una certificación automatizada general de WCAG, contraste o privacidad de toda la aplicación.

## Última evidencia registrada

Iteración onboarding de cuentas, 2026-09-17: se añadió el inicio autenticado que consulta `GET /api/accounts`, permite crear una cuenta NIO/USD mediante `POST /api/accounts`, corregir únicamente su nombre mediante `PATCH /api/accounts/[accountId]` y lista únicamente saldos persistidos. El valor visual agrupado de `MoneyInput` se normaliza antes del `POST` para que `1,000.00` llegue a la API como `1000.00`, sin debilitar su validación decimal exacta. Las violaciones del nombre único de PostgreSQL se convierten en `409` aun si Drizzle las envuelve, y el cliente tolera una respuesta vacía o no JSON sin mostrar un error técnico de `JSON`. `npm run typecheck`, `npx playwright test tests/finance-api-request.spec.ts` (5/5) y `npm run build` fueron correctos con `.env.local` cargado. Falta la comprobación manual del cambio de nombre y una prueba de integración autenticada automatizada.

Iteración sesión visible, 2026-09-17: el layout servidor pasó nombre, correo e iniciales de la sesión Auth0 a la navegación cliente y el menú de cuenta añadió cierre mediante `/auth/logout`. `npm run typecheck` y `npm run build` fueron correctos con `.env.local` cargado; todas las páginas protegidas pasaron a dinámicas por la lectura de cookies de sesión. Login real con Google, `GET /api/me` y creación del usuario local fueron comprobados manualmente. No se ejecutó Playwright después de activar Auth0 porque el servidor de desarrollo existente requiere sesión real y aún no existe un modo de autenticación de prueba para la suite.

Iteración API financiera inicial, 2026-09-17: se añadieron `GET/POST /api/accounts` y `POST /api/ledger-transactions`, con el propietario obtenido sólo desde `getCurrentUser()`. `npm run typecheck`, `npm test` (22/22 reutilizando `http://localhost:3000`) y `npm run build` fueron correctos; el build reconoció las dos rutas nuevas como dinámicas. Sin Auth0 configurado, ambos `POST` devolvieron `503` antes de procesar un cuerpo anónimo. Las pruebas de contrato del request pasaron, pero no existe prueba de integración autenticada contra un tenant o PostgreSQL con datos.

Iteración Auth0 base, 2026-09-17: se instaló `@auth0/nextjs-auth0` v4, se generó y aplicó `0001_petite_chameleon.sql` a PostgreSQL local, y la tabla `users` quedó con `auth0_subject NOT NULL` y único. `npm run typecheck`, `npm run db:check`, `npm test` (19/19 reutilizando `http://localhost:3000`) y `npm run build` fueron correctos; el build reconoció el proxy y `GET /api/me` como ruta dinámica. Sin variables Auth0, `GET /api/me` respondió `503` con el error esperado. No se probó un login, callback ni logout reales porque no existen credenciales de tenant en el entorno. `npm install` mantuvo el aviso de cuatro vulnerabilidades moderadas transitivas; no se aplicó `npm audit fix --force`.

Iteración PostgreSQL local, 2026-09-17: Docker Desktop y `compose.yaml` levantaron PostgreSQL 16 saludable. `npm run db:migrate` aplicó la migración inicial usando una `DATABASE_URL` temporal. Prueba SQL real: un ledger balanceado confirmó y uno desbalanceado fue rechazado por el trigger diferido; ambos casos se ejecutaron dentro de transacciones con `ROLLBACK`, sin datos persistentes de prueba.

Iteración de persistencia, 2026-09-17: `npm run typecheck`, `npm run db:check`, `npm test` y `npm run build` correctos. La suite Playwright terminó 19/19 pruebas correctas (19.9 s); el build generó las 12 rutas estáticas. No se ejecutó `npm run db:migrate`: falta una `DATABASE_URL`, por lo que no se modificó ninguna base de datos. `npm install` informó cuatro vulnerabilidades moderadas transitivas; no se aplicó `npm audit fix --force`.

Iteración FinancialEngine integrado, 2026-09-17: `npx playwright install chromium` completado; `npm run typecheck`, `npm test`, `npm run build` y `git diff --check` correctos. La suite Playwright terminó 18/18 pruebas correctas (12.3 s) reutilizando `http://localhost:3000`; el build generó las 12 rutas estáticas.

Iteración FinancialEngine v1, 2026-09-17: `npm run typecheck` correcto y las 7 pruebas puras de [`financial-engine.spec.ts`](../tests/financial-engine.spec.ts) correctas (4.6 s), reutilizando el servidor existente en `http://localhost:3000`. `git diff --check` correcto. La ejecución completa de `npm test` logró 10 pruebas de lógica y no pudo lanzar 7 pruebas de interfaz porque falta `chromium_headless_shell` de Playwright; el error solicita `npx playwright install`. No se ejecutó build en esta iteración. Esta evidencia no certifica las pruebas de interfaz hasta instalar ese navegador y repetirlas.

Iteración P1, 2026-09-16: 10/10 pruebas Chromium correctas (16.4 s), typecheck/build correctos y generación estática completada. Detalle en [el reporte P1](P1-implementation-report.md). Esta tarea de documentación no vuelve a ejecutar pruebas funcionales ni actualiza esos resultados como si fueran nuevos.

Inter está incluida en `src/app/fonts/InterVariable.woff2`, con licencia y `next/font/local`; el build no pide Google Fonts. No se verificó el build con toda la red deshabilitada. Instalar dependencias/navegador sí puede necesitar red.

## Diagnóstico breve

- **`next` no reconocido / no encuentra dependencias:** confirmar directorio y ejecutar `npm ci`; no hay que instalar Next globalmente.
- **Otro servidor dev activo:** abrir la URL indicada o reutilizarla para pruebas; conservar el proceso hasta que el usuario decida cerrarlo.
- **Botones de prueba sin respuesta al usar otra dirección:** revisar protección de origen y logs; usar `localhost` si ese fue el origen del servidor.
- **Aviso de lockfile fuera del repositorio:** se observó un `package-lock.json` en el directorio padre del entorno. No impidió build; cambiar raíz de Turbopack quedó fuera de P1.
- **Datos “se pierden” al recargar:** comportamiento previsto del estado mock en memoria, no una avería de persistencia.
- **Errores visuales de demo:** revisar Configuración; desactivar el flag o usar Reintentar. El error de datos no puede activarse en producción.

El README anterior también registra revisiones visuales/ad hoc más amplias. Son antecedentes, no pruebas versionadas que `npm test` reproduzca íntegramente.
