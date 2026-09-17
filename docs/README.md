# Memoria del proyecto

Actualizado: 2026-09-17. Este índice es el punto de entrada para retomar el trabajo sin reconstruir conversaciones ni leer todo el repositorio.

## Contexto rápido

- **Producto:** Inventario, un prototipo de finanzas personales que responde “¿Cuánto puedo gastar hoy sin perjudicar mis obligaciones, mi ahorro ni mi estabilidad?”.
- **Stack declarado:** Next.js 16.3.5, React 19.3, TypeScript 5.9, Tailwind 4, Lucide, Drizzle ORM y `node-postgres`. Son rangos de `package.json`; `package-lock.json` fija la instalación.
- **Estado:** frontend mock en memoria con FinancialEngine v1 integrado al cálculo y PostgreSQL 16 local migrado/verificado. Auth0 v4 está configurado y probado con una sesión real; para sesiones reales el inicio muestra onboarding/listado y corrección de nombre de cuentas PostgreSQL, sin cifras mock. El resto de pantallas sigue en memoria. Únicamente tema, privacidad y ancho del menú se guardan en `localStorage`.
- **Fuente de verdad temporal:** `FinanceProvider` en `src/hooks/use-finance.tsx` mantiene `FinanceState`; `getSnapshot()` en `src/lib/finance.ts` adapta sus saldos actuales al FinancialEngine para derivar el resumen financiero.
- **Regla central:** dinero libre = operativo − reservas − compromisos − colchón. El ahorro protegido está en cuentas separadas, no se descuenta otra vez. El hero muestra el monto gastable, mientras el desglose conserva negativos.
- **Demo base:** “hoy” está fijado al 15 de septiembre de 2026, no al reloj del equipo. C$3,082.21 − C$600 − C$0 − C$1,000 = C$1,482.21; ahorro protegido C$2,100.
- **Implementado:** Dashboard explicable, Hasta mi pago, Movimientos/filtros/detalle, Quick Add/registro, Simulador, Ahorro, Plan MVP y Configuración. Navegación mobile/rail/sidebar existente conservada.
- **P1:** cerrados DASH-03, PLAN-01 para el MVP frontend, FORM-01, STATE-03, A11Y-05, PERF-01 y QA-01. DASH-11 parcial: tarjeta disponible, ahorro automático “No configurado” porque no existe la regla financiera.
- **FinancialEngine v1:** ledger de hechos confirmados, dinero exacto con `bigint`, reconciliación de caché, reservas/obligaciones, asignación de ingresos y proyección planificada. `getSnapshot()` lo consume mediante un adaptador que preserva los escenarios y UI actuales.
- **Persistencia preparada:** esquema Drizzle, migraciones PostgreSQL con invariantes de ledger e identidad, cliente server-only y repositorios transaccionales. Las migraciones `0000` y `0001` fueron aplicadas localmente con Docker Compose; `GET /api/me`, cuentas y publicación de ledger son APIs protegidas. El onboarding/listado de cuentas ya consume la API; el resto de la UI sigue en mock.
- **Última verificación:** 2026-09-17, typecheck, `drizzle-kit check`, migración local y build correctos; 22/22 pruebas Playwright correctas antes de activar Auth0. El login real, `GET /api/me` y creación del usuario local fueron verificados manualmente; falta repetir pruebas de navegador con una estrategia de sesión de prueba.
- **Última verificación funcional registrada:** iteración P1, 10 pruebas Chromium correctas; typecheck y build correctos. Inter se sirve localmente, sin Google Fonts. Estos resultados no certifican cambios posteriores.
- **Límites:** no implementar automáticamente P2/P3, Deudas, Reportes, Calendario completo, aportes voluntarios o servicios externos. Documentar una idea no autoriza implementarla.

## Qué leer según la tarea

Lee este contexto y solo el documento relacionado; no cargues todos los archivos por defecto.

| Necesidad | Documento |
| --- | --- |
| Estado, componentes, providers y decisiones técnicas | [architecture.md](architecture.md) |
| Fórmulas, monedas, escenarios e impacto de acciones | [financial-model.md](financial-model.md) |
| Diseño de persistencia PostgreSQL desde el dominio | [postgresql-schema.md](postgresql-schema.md) |
| Auth0, sesión y propiedad de datos | [authentication.md](authentication.md) |
| Pantallas, flujos y comportamiento ya implementado | [frontend-features.md](frontend-features.md) |
| Instalar, ejecutar, probar y resolver problemas conocidos | [development-and-testing.md](development-and-testing.md) |
| Bloqueo DASH-11, limitaciones y alcance excluido | [pending.md](pending.md) |
| Secuencia de entregas | [changelog.md](changelog.md) |
| Evidencia detallada, archivos y pruebas de la iteración P1 | [P1-implementation-report.md](P1-implementation-report.md) |

## Cómo mantener esta memoria

1. Tras un cambio material, actualiza el documento temático correspondiente y añade una entrada breve al historial.
2. Actualiza este contexto si cambian el alcance, arquitectura, estado P1 o una limitación importante.
3. Registra comandos realmente ejecutados y sus resultados; nunca conviertas una prueba pendiente en una verificación exitosa.
4. Conserva los reportes históricos como evidencia de su iteración, no como especificación actual.
5. Si documentación y código difieren, inspecciona los archivos implicados y corrige la documentación. No dupliques las fórmulas ni asumas reglas ausentes.

Las reglas locales de Next.js en [AGENTS.md](../AGENTS.md) siguen vigentes: antes de modificar código Next, consulta la guía pertinente en `node_modules/next/dist/docs/`.
