# Fase 4 — Plan técnico

Aquí, y solo aquí, aparece el CÓMO.

## Produce

`specs/NNN-*/plan.md`, con la plantilla `assets/plan-template.md`.

## Antes de escribir

Lee `docs/constitution.md` y la `spec.md` completa. **Precondición:** la spec no
debe tener `[NECESITA ACLARACIÓN]` abiertos. Si los tiene, vuelve a la fase 2 o 3.

## Reglas duras

- **NO escribas código.** Pseudocódigo y firmas de funciones sí; implementación
  no. Nada de crear ficheros fuera de `specs/`.
- **Marca qué RF cubre cada parte.** Al terminar, todos los RF de la spec deben
  estar cubiertos por alguna sección. Si sobra diseño que no cubre ningún RF, o
  falta un RF sin diseño, dilo.
- Todo debe respetar la constitución. Si el diseño obvio la incumple, no lo
  escribas: expón el conflicto y pregunta.
- Cada decisión técnica lleva **su alternativa descartada y por qué**. Una
  decisión sin alternativa es una preferencia disfrazada.

## Secciones

1. **Módulos.** Qué fichero hace qué y qué puede importar cada uno. Incluye la
   API del núcleo: firmas con tipos, sin cuerpo.
2. **Modelo de datos.** Esquema **con un ejemplo real** de fichero, y qué pasa
   al leer datos de una versión anterior.
3. **Algoritmos.** Los no triviales, en pseudocódigo. Un apartado por algoritmo.
4. **Contrato de la interfaz.** Comandos y argumentos, salida por stdout y por
   stderr, y **código de salida** de cada caso. Una tabla por caso va muy bien:
   luego es el guion de los tests de extremo a extremo.
5. **Decisiones técnicas.** Cada una: qué se decide, por qué, qué se descarta.
6. **Estrategia de tests.** Qué se testea en el núcleo, qué en la interfaz, qué
   de extremo a extremo, y cómo se aíslan los datos (directorio temporal,
   variable de entorno, reloj inyectado).

## Modelo real

`eutask-cli/specs/001-habits-mvp/plan.md`: Módulos (con «API del núcleo») →
Modelo de datos → Racha (RF-3) → Contrato de la CLI → Decisiones técnicas →
Tests. Fíjate en cómo cada título cita entre paréntesis los RF que cubre.

## Cómo cerrar

Muestra la tabla de cobertura RF → sección, **pide aprobación explícita** y
para. No generes tareas todavía.
