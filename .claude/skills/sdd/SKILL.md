---
name: sdd
description: Conduce el flujo Spec-Driven Development de un proyecto — constitución, spec, clarificación, plan, tareas, implementación, validación y próximos pasos. Úsala cuando el usuario mencione SDD, spec-first, spec.md, plan.md, tasks.md, constitución del proyecto, "siguiente fase", "¿por dónde iba?", o pida crear o revisar una spec, planificar, generar tareas, implementar una tarea Tn, validar requisitos o ampliar una spec ya cerrada.
---

# SDD — desarrollo guiado por especificación

## Propósito

Conduce el proyecto por las ocho fases del flujo Spec-Driven Development, una
cada vez: detecta en qué fase está, pregunta antes de avanzar y sabe qué fichero
toca escribir. Resuelve el problema de retomar el trabajo sin recordar por dónde
ibas y de improvisar prompts en cada fase.

El flujo en una línea: **Constitución → Spec → Clarificación de Spec → Plan → Tareas →
Implementación → Validación → Próximos pasos**

## Cuándo usar esta skill

Usa esta skill cuando:

- El usuario pida crear, revisar o clarificar una spec, planificar, generar
  tareas, implementar una tarea `Tn` o validar requisitos (spec-anchored).
- El usuario pregunte «¿por dónde iba?», «siguiente fase» o «¿qué toca ahora?».
- Se mencionen los términos `SDD`, `spec-first`, `spec-anchored`.
- Se haga referencia a directorio o archivo de: docs/constitution.md`, `specs/`, `spec.md`, `plan.md` o
  `tasks.md`.
- Se quiera ampliar con algún requisito más una spec ya implementada y validada.
- Se vaya a arrancar un proyecto desde cero (spec-first).

**No la uses** para tocar código sin spec previa, respeta el flujo.

## Requisitos previos

- `bash` y `grep` para `scripts/sdd-status.sh`. Sin dependencias externas.
- Un proyecto con `docs/constitution.md`, `AGENTS.md` (spec-anchored). Si no existen, la skill
  arranca en la fase 1 y los crea (spec-first).

## Recursos incluidos

### Scripts (`scripts/`)

Código ejecutable para lo que exige un resultado determinista y se reescribiría
igual en cada sesión.

**Scripts incluidos:**

- `scripts/sdd-status.sh` — lee los artefactos de un proyecto y deduce en qué
  fase está: `docs/constitution.md`, `AGENTS.md` / `CLAUDE.md`, modo SDD, specs presentes,
  `[NECESITA ACLARACIÓN]` sin resolver, progreso de `tasks.md` y primera tarea
  abierta. No detecta lo que no deja fichero: una spec validada se ve igual que
  una sin validar.

**Uso:**

```bash
bash .claude/skills/sdd/scripts/sdd-status.sh <directorio-del-proyecto> [spec]
```

El segundo argumento es opcional: solo hace falta cuando hay varias specs en
curso y el usuario ya te ha dicho cuál seguir.

Sale `0` siempre; `2` si el directorio no existe.

### Referencias (`references/`)

Documentación que se carga en contexto solo cuando hace falta. **Lee solo la de
la fase en la que entras**, nunca todas.

**Referencias incluidas:**

- `references/1-constitution.md` … `references/8-next-steps.md` — una por
  fase: qué produce, qué leer antes, qué preguntar, reglas duras y cómo cerrar.
- `references/ears.md` — los cinco patrones EARS en español, con un ejemplo bien
  escrito y otro mal escrito.

**Uso:** léela entera al entrar en la fase y sigue su procedimiento.

### Plantillas (`assets/`)

Ficheros que se copian a la salida; no se leen para razonar.

**Plantillas incluidas:**

- `assets/constitution-template.md` — los seis principios (fase 1).
- `assets/agents-template.md` — contexto del agente (fase 1).
- `assets/spec-template.md` — estructura de la spec (fase 2).
- `assets/plan-template.md` — estructura del plan técnico (fase 4).
- `assets/tasks-template.md` — estructura de las tareas (fase 5).

**Uso:** copia la estructura y rellénala con el contenido del proyecto; no
inventes secciones ni te saltes ninguna.

## Cómo usarla

### Flujo básico

**Tarea 1: retomar el trabajo (siempre, antes de nada)**

1. Ejecuta `scripts/sdd-status.sh` sobre el proyecto.
2. Si responde `Spec activa: sin determinar`, hay varias en curso: **pregunta al
   usuario cuál seguir** y vuelve a ejecutar el script pasándosela como segundo
   argumento. No elijas tú.
3. Resume el estado en 3-4 líneas: spec activa, artefactos presentes, qué falta.
4. **Pregunta qué fase abordar**, proponiendo por defecto la que indique la
   línea `Siguiente fase:`. Espera respuesta.

**Tarea 2: ejecutar una fase**

1. Lee `references/<n>-<phase>.md` y `docs/constitution.md`.
2. Sigue el procedimiento de esa referencia, con su plantilla de `assets/`.
3. Al terminar: resume lo escrito, **pide aprobación explícita y párate**.

### Flujo avanzado

**Tarea 3: ampliar una spec ya validada (fase 8)**

1. No toques el código.
2. Lee `references/8-next-steps.md`: decide si es un RF nuevo en la spec
   cerrada o una spec `NNN+1`.
3. Si es un RF nuevo, Actualiza `spec.md`, muestra el **diff** y espera aprobación. Después, añade la tarea o tareas al final de `tasks.md` y baja a la fase 6, una cada vez. Al acabar, la spec vuelve a pasar por la fase 7.
4. Si es un `NNN+1` nuevo, comienza el proceso de worflow desde la creación de una nueva spec.

**Tarea 4: a mitad de implementación, la spec no dice qué hacer en un caso**

1. Para la tarea en curso. Esto no es la fase 8: la implementación sigue abierta.
2. Pregunta al usuario y vuelve a la fase 2 para escribir ese caso en la spec, o
   a la 3 si son varios los huecos.
3. Retoma la tarea con la spec ya completa.

## Información clave

| # | Fase | Precondición | Escribe | Referencia |
|---|---|---|---|---|
| 1 | Constitución | — | `docs/constitution.md` (+ `AGENTS.md`) | `1-constitution.md` |
| 2 | Spec | constitución aprobada | `specs/NNN-<kebab>/spec.md` | `2-spec.md` |
| 3 | Clarificación | spec redactada | nada: solo detecta | `3-clarification.md` |
| 4 | Plan | spec sin `[NECESITA ACLARACIÓN]` | `specs/NNN-*/plan.md` | `4-plan.md` |
| 5 | Tareas | plan aprobado | `specs/NNN-*/tasks.md` | `5-tasks.md` |
| 6 | Implementación | tareas abiertas | código, tests y el checkbox de esa tarea | `6-implementation.md` |
| 7 | Validación | todas las tareas cerradas | nada: veredicto | `7-validation.md` |
| 8 | Próximos pasos | spec implementada y validada | `spec.md` primero, luego tareas nuevas | `8-next-steps.md` |

- **Regla de oro:** la spec es el contrato. Si algo no está en la spec, no se
  implementa. Y una discrepancia entre código y spec **no se resuelve en
  silencio ni solo en el código**: para y decide cuál de los dos está mal.
  - Si la spec sigue expresando lo que se quiere, el código tiene un bug:
    corrige el código.
  - Si al implementar se ha visto que la spec estaba equivocada, corrige la
    **spec primero** —fase 2 si sigue abierta, fase 8 si estaba cerrada— y
    después el código.
  - El desempate lo fija la constitución del proyecto. Si calla, pregunta al
    usuario; no lo decidas tú.
- **Ubicación de los artefactos:** `docs/constitution.md` y `specs/NNN-<kebab>/`
  dentro de cada proyecto.
- **Limitaciones:** no propone ni redacta commits; no ejecuta despliegues; no
  decide por ti entre RF nuevo y spec nueva (pregunta).

## Resolución de problemas

**`sdd-status.sh` dice `No existe el directorio: X` (salida 2)**

- **Causa:** la ruta es relativa a donde se ejecuta el comando, no a la skill.
- **Solución:** pásale la ruta del proyecto desde la raíz del repo, p. ej.
  `bash .claude/skills/sdd/scripts/sdd-status.sh eutask-cli`.

**El script marca la fase 7 en una spec que ya validaste**

- **Causa:** la validación no deja artefacto, así que no es detectable.
- **Solución:** dilo al usuario y pregunta si la da por cerrada; no la revalides
  por tu cuenta.

## Buenas prácticas

Reglas transversales, aplican en todas las fases:

- Lee `docs/constitution.md` y la spec activa **antes** de tocar nada.
- **Fases 1 a 5: prohibido escribir código.**.
- Preguntas de **una en una**, máximo 6, esperando respuesta. Prioriza las que
  cambian lo que hay que construir.
- Lo que no sepas va como `[NECESITA ACLARACIÓN: pregunta concreta]`.
- Idioma: el que fije la constitución. De base en los repos si no se especifica nada, identificadores y tipos en inglés; mensajes de usuario y documentación en español.
- Al cerrar cualquier fase: resume, **pide aprobación explícita y párate**.

Anti-patrones:

- Encadenar fases sin preguntar (redactar la spec y seguir con el plan).
- Implementar dos tareas seguidas «porque eran pequeñas».
- Ampliar el alcance sobre la marcha: si la spec está cerrada, es la fase 8; si
  sigue abierta, se corrige en la fase 2. Nunca en el código primero.
- Dar por buena una spec con adjetivos no medibles («rápido», «intuitivo») o con
  requisitos que unen dos comportamientos con un «y».
- Proponer o redactar commits: queda fuera de esta skill.

## Notas adicionales

- **Coste en contexto:** lo que está en este fichero se paga en cada sesión; lo
  de `references/` solo al entrar en su fase.
- **Instalación en otros proyectos o en opencode:** ver `README.md`.

## Ejemplos

Estado real del repo al escribir esto:

```
$ bash .claude/skills/sdd/scripts/sdd-status.sh eutask-cli
Proyecto: eutask-cli
Constitucion: OK docs/constitution.md
Contexto del agente: OK AGENTS.md

Specs:
  001-habits-mvp           spec OK  plan OK  tasks OK (17/17)
  002-habits-frequency     spec OK  plan FALTA  tasks FALTA

Spec activa: 002-habits-frequency
Siguiente fase: 3. Clarificacion o 4. Plan
```

Artefactos reales que sirven de modelo en cada fase:

- Constitución: `eutask-cli/docs/constitution.md` — seis principios verificables.
- Spec: `eutask-cli/specs/001-habits-mvp/spec.md` — RF-1 a RF-8 en EARS, con
  criterios numerados `RF-1.1`, `RF-1.2`, …
- Plan: `eutask-cli/specs/001-habits-mvp/plan.md` — Módulos → Modelo de datos →
  Racha → Contrato CLI → Decisiones → Tests.
- Tareas: `eutask-cli/specs/001-habits-mvp/tasks.md` — T1 a T17, cada una con
  sus RF y su línea `Hecho cuando:`.
