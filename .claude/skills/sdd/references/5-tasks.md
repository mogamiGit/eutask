# Fase 5 — Tareas

Trocear el plan en unidades que se puedan hacer y verificar de una sentada.

## Produce

`specs/NNN-*/tasks.md`, con la plantilla `assets/tasks-template.md`.

## Antes de escribir

Lee `spec.md` y `plan.md` de la spec activa. El plan debe estar aprobado.

## Reglas duras

- Tareas **pequeñas: 20-30 minutos** cada una. Si no sabes estimarla, es
  demasiado grande.
- **Orden de dependencia**: cada tarea solo necesita las anteriores.
- Cada tarea lleva tres cosas:
  1. checkbox `- [ ] Tn.` y una descripción de una línea;
  2. los **RF que cubre** entre paréntesis (`(RF-1.2..1.5, RF-8.4)`), o `(RF: —)`
     si es andamiaje;
  3. una línea **`Hecho cuando:`** verificable, que nombre los casos concretos
     que deben quedar en verde. «Hecho cuando: funciona» no vale.
- El conjunto de tareas debe cubrir **todos** los RF de la spec. Comprueba y di
  cuáles quedan sin tarea.
- La primera tarea suele ser el andamiaje (proyecto, dependencias, runner de
  tests) y la última el cierre: casos límite transversales y repaso de la spec.
- **NO escribas código** en esta fase.

## Modelo real

`eutask-cli/specs/001-habits-mvp/tasks.md`, T1 a T17. Ejemplo de tarea bien
escrita:

> - [ ] T3. core.computeStreak con `today` inyectado. (RF-3)
>       Hecho cuando: tests de sin marcas, solo hoy, viva por ayer, hueco y
>       racha larga en verde.

## Cómo cerrar

Muestra la lista y la cobertura RF → tarea, **pide aprobación explícita** y
para. No empieces T1.
