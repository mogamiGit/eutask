# Fase 2 — Especificación

Convierte una idea vaga en una especificación acordada. La spec es el contrato:
si algo no está aquí, no se implementa.

## Produce

`specs/NNN-<nombre-en-kebab-case>/spec.md`, con la plantilla
`assets/spec-template.md`. Mira `specs/` y usa el **siguiente número libre con
tres dígitos**.

## Antes de escribir

Lee `docs/constitution.md` y las specs previas de `specs/`, para respetar
convenciones y no contradecir lo ya acordado.

## Entrevista

Preguntas de **una en una**, máximo 6, esperando respuesta antes de la
siguiente. Céntrate en:

- casos límite (vacíos, duplicados, datos corruptos, límites);
- comportamiento ante errores (¿qué mensaje?, ¿qué código de salida?);
- qué queda **fuera** de esta iteración.

No propongas soluciones técnicas. Si el usuario pregunta «¿cómo lo harías?»,
redirige al QUÉ: eso es la fase 4.

## Reglas duras

- La spec describe **QUÉ** y **POR QUÉ**. Prohibido: stack, arquitectura,
  nombres de archivo, esquemas de datos, algoritmos o firmas de funciones.
- Criterios de aceptación **siempre en notación EARS** (ver `ears.md`),
  numerados RF-1, RF-2, …
- Cada requisito debe ser verificable: si no se te ocurre cómo comprobarlo, está
  mal escrito.
- **Un requisito, una frase.** Si necesitas un «y» para unir dos
  comportamientos, son dos requisitos.
- Sin adjetivos no medibles: «rápido», «intuitivo», «robusto» no son requisitos.
  Escribe el umbral o no lo escribas.
- Incluye **siempre** la sección «Fuera de alcance»: es la que evita que la
  funcionalidad crezca sola.
- Lo que no sepas va como `[NECESITA ACLARACIÓN: pregunta concreta]`. Nunca
  rellenes inventando.
- No te saltes secciones de la plantilla.

## Modelo real

`eutask-cli/specs/001-habits-mvp/spec.md`: un `### RF-n — Título (HU-n)` por
requisito, con sus criterios EARS numerados debajo (`RF-1.1`, `RF-1.2`, …), lo
que luego permite que `tasks.md` cite `RF-1.2..1.5`.

## Cómo cerrar

Resume los RF escritos y las dudas abiertas. **Pide aprobación explícita.** No
pases al plan ni escribas código hasta tenerla. El siguiente paso natural es la
fase 3, no la 4.
