# Pendientes y límites de alcance

## DASH-11 — único P1 parcialmente abierto

Implementado: `IncomeAllocationCard`, selección del último ingreso recibido, conversión a NIO y flujo ingreso → ahorro → disponible.

Bloqueo: `FinanceState` y mocks no definen una regla de ahorro automático ni relacionan el ingreso con una reserva. No se puede atribuir la reserva existente de C$600 al último ingreso, ni inventar un porcentaje.

UI actual: “No configurado”; explica que no se apartó dinero automáticamente y muestra el ingreso completo como disponible para distribuir. No confundir ese remanente con todo el dinero libre global del hero.

Para cerrarlo se necesita una definición explícita del monto/porcentaje, condiciones de aplicación, destino y vínculo entre ingreso/reserva. Tras acordarla, podrá aplicarse en el estado frontend y probar su impacto sin requerir backend. Este documento no elige esos valores.

## Limitaciones del prototipo, no nuevas funcionalidades prometidas

- Datos financieros en memoria; no persistencia ni autenticación real.
- Presupuestos del ciclo actual, sin rollover/historial por ciclo ni bloqueo de compras.
- Series recurrentes existentes agrupadas por tipo/título; frecuencia es metadata, sin generación de ocurrencias ni cambio de fechas ya registradas.
- Sin creación completa de nuevas series o programación de pagos.
- Transferencias no consumen automáticamente reservas; reservas liberadas/editadas conservan historial de movimientos.
- Posponer una compra produce un toast, no un recordatorio guardado.
- Configuración no permite editar en general las reglas financieras.

## P2/P3 expresamente fuera de la iteración P1

No implementar sin una nueva solicitud:

- Safe-area lateral.
- Tamaño del target del toast.
- Tipo de cambio dentro del modo privacidad.
- Drag real de sheets.
- Timeline de omitidos.
- Manifest/PWA.
- Tipografía pequeña del rail.
- Deudas y Reportes completos.
- Calendario completo.
- Aportes voluntarios.

Backend, APIs, autenticación real y base de datos también siguen fuera del alcance frontend actual. No se han estimado ni repriorizado aquí.

Estado de aceptación y evidencia histórica por ID: [reporte P1](P1-implementation-report.md). La petición posterior de documentar no cambia el estado funcional de esos hallazgos.
