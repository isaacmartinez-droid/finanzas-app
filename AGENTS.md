<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Memoria y documentación del proyecto

- Al iniciar una tarea, leer `docs/README.md` como contexto breve y abrir únicamente los documentos temáticos necesarios. No cargar todos los reportes ni reconstruir conversaciones por defecto.
- La documentación resume el estado; verificar los archivos implicados antes de cambiar código. Las guías locales de Next.js exigidas arriba siguen siendo obligatorias.
- Después de cambios materiales, actualizar el documento temático correspondiente, `docs/changelog.md` y el contexto del índice si cambia el estado general.
- Mantener resultados de pruebas con su fecha/iteración. No afirmar que una verificación antigua valida cambios nuevos; no registrar comandos que no se ejecutaron.
- Conservar los reportes históricos. Documentar pendientes no autoriza expandir alcance, inventar reglas financieras o implementar P2/P3.
