# Fase 3 — Clarificación

Revisión de la spec como un QA muy profesional, antes de planificar. Es la fase
más barata para encontrar un error: aquí cuesta una línea, en la fase 6 cuesta
un refactor.

## Produce

**Ningún fichero.** Esta fase solo detecta.

## Antes de escribir

Lee `docs/constitution.md` y la `spec.md` de la spec activa, entera.

## Reglas duras

- **Solo detecta, no resuelvas.** No propongas soluciones hasta que el usuario
  te las pida, y entonces vuelve a la fase 2 para aplicarlas.
- No edites `spec.md` en esta fase.
- Formato: cuatro bloques, cada uno con lista numerada, citando el RF afectado.

## Los cuatro bloques

1. **Ambigüedades.** Frases que admiten dos lecturas, umbrales sin número,
   adjetivos no medibles, «debería» en vez de «hará».
2. **Contradicciones entre requisitos.** Dos RF que piden cosas incompatibles, o
   un caso límite que contradice el flujo principal.
3. **Casos límite no cubiertos.** Entradas vacías, duplicados, datos corruptos,
   límites numéricos, unicode, concurrencia, primera ejecución, ausencia de
   fichero de datos.
4. **Conflictos con la constitución.** Un requisito que exige una dependencia no
   permitida, que mete lógica en la interfaz o que cambia el formato de
   persistencia sin decirlo.

Añade al final el recuento de `[NECESITA ACLARACIÓN]` que siguen abiertos.

## Cómo cerrar

Entrega la lista y para. Di explícitamente si la spec está lista para la fase 4
o si hay que volver a la 2. **Regla:** con `[NECESITA ACLARACIÓN]` abiertos o
contradicciones sin resolver, no se planifica.
