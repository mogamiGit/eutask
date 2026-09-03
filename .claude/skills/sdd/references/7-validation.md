# Fase 7 — Validación

Comprobar que lo implementado es lo especificado. No «parece que funciona»:
requisito por requisito.

## Produce

**Ningún fichero.** Un informe y un veredicto.

## Antes de escribir

Lee la `spec.md` completa y `tasks.md`. Todas las tareas deben estar cerradas.

## Procedimiento

1. Recorre la spec **RF por RF, en orden**, sin saltarte ninguno ni agrupar.
   Para cada uno indica:
   - qué test lo cubre (fichero y nombre del caso);
   - el **resultado real de ejecutarlo**, no una suposición.
2. Marca claramente los RF **sin test** y los que **fallan**. Un RF sin test es
   un RF no cumplido, aunque el código parezca correcto.
3. Repasa los casos límite de la spec: mismo tratamiento.
4. Repasa los **criterios de finalización** de la spec, uno a uno.
5. Si la spec pide una demo manual del flujo principal, ejecútala y pega la
   salida.
6. **Veredicto explícito:** ¿la spec está cumplida, sí o no? Sin matices tibios.
   Si no lo está, lista exactamente qué falta.

## Reglas duras

- No arregles nada en esta fase. Si detectas un fallo, la reparación es una
  tarea nueva (fase 5); si el fallo es que la spec no cubre el caso, se corrige
  en la fase 2.
- No des por cubierto un RF por «cobertura indirecta»: nombra el test.
- Formato: una tabla o lista `RF-n → test → resultado`, y debajo el veredicto.

## Cómo cerrar

Entrega el informe y el veredicto, y para. Si hay huecos, propón el siguiente
paso (tarea nueva, o volver a la fase 2) y espera respuesta.

Con veredicto positivo, la spec queda cerrada. A partir de ahí, cualquier
requisito más entra por la fase 8.
