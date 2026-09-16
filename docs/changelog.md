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
