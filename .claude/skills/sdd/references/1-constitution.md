# Fase 1 — Constitución

## Produce

- `docs/constitution.md` — plantilla en `assets/constitution-template.md`.
- Opcionalmente `AGENTS.md` (plantilla en `assets/agents-template.md`) y un
  `CLAUDE.md` que contenga una sola línea: `@AGENTS.md`.

## Antes de escribir

Mira si ya existe una constitución. Si existe, no la reescribas: esta fase ya
está hecha. Pregunta si quiere revisarla o pasar a la fase 2.

## Preguntas al usuario (de una en una, máx. 6)

Solo las que no puedas deducir del repo:

1. ¿Qué es el proyecto y quién debe poder mantenerlo? (junior, equipo, solo tú)
2. ¿Stack y versión mínima? ¿Qué dependencias se permiten y cuáles exigen spec?
3. ¿Dónde vive la lógica pura y dónde la interfaz?
4. ¿Política de tests: qué se testea siempre y qué comando debe pasar?
5. ¿Cómo y dónde persisten los datos?
6. ¿Idioma de identificadores y de los mensajes al usuario?

## Reglas duras

- **6 principios**, cortos y **verificables**. Máximo 15 líneas en total.
- Cubre siempre: simplicidad del stack, relación spec↔código, separación entre
  lógica e interfaz, política de tests, persistencia e idioma.
- Un principio es verificable si puedes decir en una frase cómo se incumple.
  «Código limpio» no vale; «`src/core.ts` no importa `fs`, `process` ni
  `commander`» sí.
- Empieza el documento diciendo que un cambio que incumpla cualquier principio
  no se acepta. Esa frase es la que le da valor al resto.
- El principio sobre la relación spec↔código es el que **fija el modo SDD**, y
  por eso no se pregunta aparte. Si dice que todo cambio de comportamiento
  empieza en `specs/` y que ante discrepancia gana la spec, el proyecto queda
  **spec-anchored**. Si la constitución solo fija stack, tests y calidad, queda
  **spec-first**: la spec arranca el desarrollo y puede morir al implementarla.
  Escribe el que corresponda a lo que el usuario haya dicho; no lo des por
  supuesto ni lo conviertas en una séptima pregunta.

## Modelo real

`eutask-cli/docs/constitution.md`: seis principios numerados y en negrita —
Simplicidad primero, La spec manda, Núcleo puro, Tests siempre, Persistencia
simple y explícita, Idioma.

## Cómo cerrar

Muestra el documento propuesto, **espera aprobación explícita** y para. Ofrece
como siguiente paso generar `AGENTS.md` y `CLAUDE.md`, no la spec.
