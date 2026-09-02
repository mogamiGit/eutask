# Notación EARS (en español)

Cinco patrones. Elige el que corresponda, no mezcles.

| Patrón | Forma | Cuándo |
|---|---|---|
| Ubicuo | EL SISTEMA \<hará\> | siempre cierto |
| Dirigido por evento | CUANDO \<disparador\>, EL SISTEMA \<hará\> | responde a algo |
| Estado | MIENTRAS \<estado\>, EL SISTEMA \<hará\> | durante una condición |
| Opcional | DONDE \<característica\>, EL SISTEMA \<hará\> | solo si está presente |
| No deseado | SI \<condición\>, ENTONCES EL SISTEMA \<hará\> | errores y casos límite |

## Ejemplo bien escrito

> RF-4: SI el nombre ya existe (comparación ignorando mayúsculas y espacios
> exteriores), ENTONCES EL SISTEMA no creará un duplicado e informará del
> conflicto (salida 1).

Un patrón, un comportamiento, criterio comprobable y resultado observable.

## Mal escrito, para contrastar

> ~~RF-4: El sistema debe manejar bien los duplicados y ser rápido.~~

Sin patrón EARS, sin criterio verificable, dos ideas en una frase y un adjetivo
no medible.

## Comprobación rápida

Antes de dar por bueno un RF:

1. ¿Empieza por uno de los cinco patrones?
2. ¿Describe **un** comportamiento? (si hay un «y», pártelo en dos RF)
3. ¿Se te ocurre el test que lo comprueba? Si no, está mal escrito.
4. ¿Dice el resultado observable (mensaje, salida, código de salida)?
5. ¿Está libre de adjetivos no medibles?
