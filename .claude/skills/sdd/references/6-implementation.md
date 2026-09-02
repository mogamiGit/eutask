# Fase 6 — Implementación

**Una sola tarea por vez.** Es la regla que sostiene todo el flujo.

## Produce

- Los tests y el código de **una** tarea `Tn`.
- El checkbox de esa tarea marcado en `tasks.md`.

## Antes de escribir

1. Lee `docs/constitution.md`, la `spec.md` y el `plan.md` de la spec activa.
2. Identifica la tarea: la que pida el usuario, o la primera abierta según
   `sdd-status.sh`. **Confírmala con el usuario antes de empezar.**
3. Relee su línea `Hecho cuando:`: es el criterio de aceptación de la tarea.

## Procedimiento

1. **Tests primero.** Escribe los casos de `Hecho cuando:` y compruébalos en
   rojo antes de tocar el código.
2. Implementa lo mínimo que los pone en verde. Nada de la tarea siguiente
   «ya que estamos».
3. Ejecuta la suite del proyecto (el comando está en `AGENTS.md`: `npx vitest
   run`, `pytest -q`, …) y **muestra el resultado real**. Si algo falla, dilo con
   la salida; no lo resumas como «pasa todo».
4. Marca `- [x] Tn` en `tasks.md`.
5. Indica qué RF cubre lo implementado.
6. **Párate.** No empieces T(n+1).

## Reglas duras

- No cambies el comportamiento acordado. Si al implementar descubres que la spec
  no dice qué hacer en un caso, **para y pregunta**: ese hueco se cierra en la
  fase 2, nunca decidiéndolo tú en el código. No es la fase 8: la fase 8 es para
  ampliar una spec ya validada, y esta sigue abierta.
- No añadas dependencias ni cambies el formato de persistencia sin actualizar
  antes la spec.
- No toques ficheros de `specs/` salvo el checkbox de la tarea.
- Respeta la constitución, en especial la separación núcleo/interfaz.
- **No propongas ni redactes commits.** Queda fuera de esta skill.

## Cómo cerrar

Resume en tres líneas: qué tarea, qué RF cubre y el resultado de la suite.
Pregunta si seguir con la siguiente tarea. Espera respuesta.
