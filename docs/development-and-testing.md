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

## Verificar cambios funcionales

```powershell
npx playwright install chromium  # primera instalación; requiere red
npm test
npm run typecheck
npm run build
git diff --check
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

Las pruebas del simulador son de lógica, no un flujo completo de navegador. El test de recurrencia comprueba el estado visible pausado; no afirma probar toda la proyección. El responsive versionado cubre Dashboard, no todas las rutas/sheets. No existe una certificación automatizada general de WCAG, contraste o privacidad de toda la aplicación.

## Última evidencia registrada

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
