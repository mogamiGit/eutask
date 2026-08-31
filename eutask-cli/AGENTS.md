# AGENTS.md — eutask-cli

## Proyecto
`eutask-cli`: CLI en TypeScript/Node.js para crear y registrar hábitos, y calcular rachas de días consecutivos. Núcleo puro (`src/core.ts`) + capa CLI (`src/commands/`). Persistencia en JSON local (`src/storage.ts`, en `~/.eutask/data.json`).

## Comandos
- Ejecutar: `npx eutask <comando>`
- Tests: `npx vitest run`

## Estilo
- Node.js 20+, TypeScript estricto (`strict: true` en `tsconfig.json`).
- Dependencias mínimas: `commander` (comandos), `chalk` (colores), `date-fns` (fechas/rachas), `zod` (validación de entrada). `fs` nativo para persistencia; sin librería extra de DB salvo que se decida migrar a SQLite.
- Identificadores en inglés; mensajes de usuario en español.

## Reglas
- Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.
- No añadas dependencias ni cambies el formato del JSON sin actualizar antes la spec.
- No modifiques archivos dentro de `specs/` salvo petición explícita.

## Al terminar cualquier tarea
- Ejecuta `vitest run` y confirma en tu respuesta que todo pasa.

