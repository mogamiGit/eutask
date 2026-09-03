# Fase 8 — Próximos pasos

La spec está implementada y validada. Llega una ampliación pequeña: uno o dos
requisitos más sobre lo que ya funciona. **No se toca el código.**

## Precondición

Fase 7 superada: todas las tareas cerradas y veredicto de spec cumplida. Si la
implementación sigue abierta, esto no es la fase 8 — termina primero.

## Produce

En este orden, y no otro:

1. El requisito nuevo en `spec.md`, con su diff aprobado.
2. Las tareas nuevas al final de `tasks.md`.
3. Después, ya en la fase 6, el código.

## Antes de escribir

Lee `docs/constitution.md`, la `spec.md` y el `plan.md` de la spec cerrada.
Decide, y **pregunta al usuario si no está claro**:

- **RF nuevo en la spec activa** — ampliación pequeña de algo ya especificado.
  Es el caso normal de esta fase.
- **Spec nueva `NNN+1`** — si es una funcionalidad distinta, o si son tantos
  requisitos que la spec cerrada dejaría de leerse como un todo. Entonces vuelve
  a la fase 2.

## Procedimiento

1. Redacta el requisito en **notación EARS** (`ears.md`), con el número
   siguiente al último RF, junto con sus casos límite. Pregunta por ellos: casi
   siempre son la parte interesante de la ampliación («¿y si ya estaba
   marcado?», «¿afecta a lo que ya había?», «¿qué pasa con los datos ya
   guardados?»).
2. Revisa qué otros RF quedan afectados. Actualiza también «Casos límite»,
   «Fuera de alcance» y «Criterios de finalización» si procede.
3. **Muestra el diff de la spec.** No un resumen: el diff. Espera aprobación.
4. Comprueba si el cambio afecta al `plan.md` (modelo de datos, contrato de la
   interfaz). Si lo afecta, actualízalo antes de las tareas.
5. Añade la tarea o tareas al final de `tasks.md`, con las mismas reglas de la
   fase 5: pequeñas, con sus RF y su línea `Hecho cuando:`.
6. Entra en la fase 6 con la primera de ellas. Una cada vez.

## Reglas duras

- **Ni una línea de código** hasta que la spec esté actualizada y aprobada.
- No renumeres los RF existentes: los tests y las tareas ya cerradas los citan.
- No borres requisitos antiguos sin decirlo. Si un RF queda derogado, márcalo y
  explica por qué.
- Si la ampliación choca con la constitución, no la escribas: expón el
  conflicto. Cambiar la constitución es una decisión aparte, de la fase 1.
- Al terminar la ampliación, la spec vuelve a pasar por la fase 7: los RF nuevos
  también necesitan su veredicto.

## Modelo real

El prompt de «Próximos pasos» del README de `habits-cli`: marcar como hecho el
día de ayer con `habits done <nombre> --ayer`. Primero el RF en la spec, con sus
casos límite («¿y si ayer ya estaba marcado?», «¿afecta a la racha?»), y el diff
a la vista. El código, después.

## Cómo cerrar

Diff mostrado, tareas nuevas listadas, aprobación pedida, para. Recuerda cuál es
el siguiente paso: la fase 6 con la primera tarea nueva.
