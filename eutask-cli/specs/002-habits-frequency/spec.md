# Spec 002 — Frecuencias distintas de la diaria

## Contexto y objetivo

La spec 001 dejó fuera de alcance los hábitos con frecuencia distinta de la diaria. Pero no todo
hábito toca todos los días: hay rutinas de días fijos (gimnasio los lunes, miércoles y viernes) y
rutinas de cupo semanal (correr tres veces por semana, sin importar cuáles). Hoy el sistema las
castiga: cualquier día sin marca rompe la racha, así que la racha miente y el listado marca como
pendiente lo que era descanso.

Esta spec añade dos frecuencias nuevas —días fijos y x veces por semana— y define qué significa la
racha en cada una. **Depende de la spec 001**, que sigue vigente: todo lo que aquí no se cambia,
queda como está allí.

## Usuarios

Los mismos de la spec 001: quien ya usa `eutask` a diario y tiene al menos un hábito que no es
diario.

## Historias de usuario

- **HU-1.** Como usuario, quiero declarar que un hábito solo toca ciertos días de la semana, para no
  arrastrar como pendiente algo que hoy no me corresponde hacer.
- **HU-2.** Como usuario, quiero declarar que un hábito toca un número de veces por semana sin fijar
  cuáles, para tener margen de reparto y que la racha mida semanas cumplidas, no días seguidos.
- **HU-3.** Como usuario, quiero que la racha de un hábito no diario refleje su frecuencia, para que el descanso no la rompa y el número signifique algo. En este caso romperíamos racha cuando haya finalizado la semana.
- **HU-4.** Como usuario, quiero cambiar la frecuencia de un hábito ya existente sin perder su
  historial, porque mis rutinas cambian antes que mis hábitos.

## Requisitos funcionales (criterios de aceptación EARS)

### RF-1 — Declarar la frecuencia

- RF-1.1: El sistema debe admitir tres frecuencias y solo tres: **diaria** (todos los días), **por
  días fijos** (un subconjunto no vacío de los siete días de la semana) y **x veces por semana** (un
  cupo de N cumplimientos, sin días asignados).
- RF-1.2: Cuando el usuario ejecute `eutask add <nombre>` sin opción de frecuencia, el sistema debe
  registrar el hábito como diario. Cuando lo ejecute con `--days <lista>` debe registrarlo por días
  fijos, y con `--times <N>` como x veces por semana.
- RF-1.3: Cuando el sistema confirme la creación de un hábito, debe indicar además la frecuencia con
  la que ha quedado registrado (salida 0), como extensión de RF-1.1 de la spec 001.
- RF-1.4: El sistema debe validar la frecuencia antes de registrar nada: `--days` acepta una lista
  separada por comas de entre uno y siete días distintos, escritos como `lun`, `mar`, `mie`, `jue`,
  `vie`, `sab`, `dom`, sin distinguir mayúsculas ni exigir la tilde de `mié` y `sáb`; `--times`
  acepta un entero entre 1 y 7. Si el valor no cumple la regla, si se repite un día, o si se
  combinan `--days` y `--times` en la misma orden, entonces el sistema debe rechazar la operación,
  explicar el formato correcto y no registrar nada (salida 1).
- RF-1.5: El sistema debe considerar **día exigido** todo día en que la frecuencia pide un
  cumplimiento, y **día de descanso** cualquier otro. En la frecuencia diaria todos los días son
  exigidos y no hay descansos; en la frecuencia por días fijos son exigidos los días declarados; en
  x veces por semana no hay días exigidos ni de descanso, porque la exigencia es semanal y no
  diaria.
- RF-1.6: El sistema debe tomar la semana como el intervalo de lunes a domingo en fecha local, y
  contar como semana en curso la que contiene el día actual.

### RF-2 — Racha de un hábito por días fijos (HU-3)

- RF-2.1: El sistema debe contar la racha en **días exigidos consecutivos cumplidos** hacia atrás
  desde el último día exigido ya vencido o cumplido, saltando los días de descanso: un día de
  descanso nunca suma ni rompe la racha.
- RF-2.2: Mientras hoy sea día exigido y no tenga marca, el sistema debe mantener viva la racha
  durante todo el día de hoy y calcularla desde el día exigido anterior, igual que RF-3.3 de la
  spec 001 hace con el día de ayer en la frecuencia diaria.
- RF-2.3: Cuando un día exigido ya vencido queda sin marca, el sistema debe calcular una racha de 0
  días.
- RF-2.4: El sistema debe seguir tomando la fecha local actual como dato de entrada del cálculo, sin
  consultar el reloj por su cuenta (RF-3.1 de la spec 001, sin cambios).

### RF-3 — Racha de un hábito de x veces por semana (HU-3)

- RF-3.1: El sistema debe contar la racha en **semanas consecutivas cumplidas**: semanas ya
  cerradas, hacia atrás desde la última cerrada, en las que el número de días distintos con marca
  alcanza o supera el cupo N.
- RF-3.2: Cuando la semana en curso ya alcanza el cupo, el sistema debe sumarla a la racha aunque la
  semana no haya terminado.
- RF-3.3: Mientras la semana en curso no alcance el cupo y queden días suficientes para alcanzarlo
  —los días que restan hasta el domingo, hoy incluido, no son menos que las marcas que faltan—, el
  sistema debe mantener la racha de las semanas cerradas sin sumar la actual: la semana sigue viva.
- RF-3.4: Cuando en la semana en curso ya es imposible alcanzar el cupo, el sistema debe calcular
  una racha de 0 semanas, sin esperar al domingo.
- RF-3.5: El sistema debe contar como mucho una marca por día para el cupo: dos `done` el mismo día
  no aportan dos cumplimientos (RF-2.2 de la spec 001, sin cambios).

### RF-4 — Marcar y desmarcar con frecuencia no diaria

- RF-4.1: Cuando el día actual no esté exigido por la frecuencia del hábito —un día de descanso de
  RF-1.5—, el sistema debe registrar igualmente la marca de `done`, advertir de que hoy era día de
  descanso y terminar con éxito (salida 0).
- RF-4.2: El sistema debe dejar la marca puesta en día de descanso en el historial sin que sume ni
  rompa la racha, según RF-2.1.
- RF-4.3: El sistema debe expresar siempre la racha con su unidad —días para la frecuencia diaria y
  por días fijos, semanas para x veces por semana— en toda salida que la muestre: `done`, `undone`
  y `list`.

### RF-5 — Listado con frecuencias (HU-3)

- RF-5.1: Cuando el usuario ejecute `eutask list`, el sistema debe mostrar, por cada hábito, además
  de lo que ya exige RF-4.1 de la spec 001, su frecuencia y la unidad de su racha.
- RF-5.2: El sistema debe distinguir tres estados de hoy en la marca textual de cada línea:
  cumplido, pendiente y **descanso** —este último cuando hoy no está exigido por la frecuencia y no
  hay marca—. La marca textual debe conservarse aunque la salida se redirija a un archivo o a otro
  programa.
- RF-5.3: Cuando el hábito es de x veces por semana, el sistema debe mostrar el avance del cupo de
  la semana en curso —marcas hechas frente a marcas exigidas—, porque el estado de hoy por sí solo
  no dice si la semana va encaminada.
- RF-5.4: El sistema debe seguir ordenando la lista por racha descendente. Cuando se comparan rachas
  de unidades distintas, debe ordenarlas por su valor numérico: una racha de 3 semanas y otra de 3
  días quedan empatadas y se desempatan por identificador ascendente.

### RF-6 — Cambiar la frecuencia (HU-4)

- RF-6.1: Cuando el usuario ejecute `eutask freq <id> --days <lista>`, `eutask freq <id> --times
  <N>` o `eutask freq <id> --daily` sobre un hábito existente con una frecuencia válida, el sistema
  debe sustituir la frecuencia, conservar intactos el identificador, el nombre y todas las marcas, y
  confirmar el cambio mostrando la frecuencia nueva y la racha ya recalculada (salida 0).
- RF-6.2: El sistema debe recalcular la racha aplicando la frecuencia nueva a todo el historial, sin
  guardar ningún valor de racha anterior: la racha es siempre un cálculo sobre las marcas, no un
  dato almacenado. Cambiar de frecuencia puede por tanto subir la racha, bajarla o ponerla a 0, y no
  se avisa de ello más allá del valor mostrado.
- RF-6.3: Cuando la frecuencia nueva coincide con la vigente, el sistema debe aceptar la operación
  como cambio sin efecto y terminar con éxito (salida 0).
- RF-6.4: Si `eutask freq <id>` se ejecuta sin ninguna opción de frecuencia, entonces el sistema
  debe rechazar la orden, recordar las tres opciones disponibles y no modificar ningún dato
  (salida 1).
- RF-6.5: El sistema debe aplicar a `freq` las mismas reglas de identificador que RF-1.8 de la spec
  001 impone a `done`, `undone`, `rename` y `remove`.

### RF-7 — Persistencia y compatibilidad

- RF-7.1: El sistema debe guardar la frecuencia de cada hábito en el mismo archivo JSON de la spec
  001, con las mismas garantías de escritura atómica (RF-8.3 de la spec 001).
- RF-7.2: Si un hábito almacenado no tiene frecuencia registrada —dato escrito por una versión
  anterior—, entonces el sistema debe tratarlo como diario, sin avisar ni pedir nada al usuario y
  sin reescribir el archivo por ese motivo.
- RF-7.3: Si la frecuencia almacenada de un hábito no es válida según RF-1.4, entonces el sistema
  debe tratarlo como dato corrupto: informar del problema y detenerse sin sobrescribir el archivo
  (RF-8.5 de la spec 001, salida 1).

## Requisitos no funcionales

Rigen los tres de la spec 001 sin cambios (respuesta <1 s, mensajes accionables en español, un solo
usuario a la vez).

## Casos límite

**Días fijos**

- Hábito `lun,mié,vie` cumplido el viernes; hoy es domingo → RF-2.1 (sábado y domingo son descanso:
  la racha sigue viva y hoy figura como descanso, no como pendiente).
- Hábito `lun,mié,vie` sin marca el miércoles; hoy es jueves → RF-2.3 (día exigido vencido sin
  marca: racha 0).
- Hábito `lun,mié,vie` sin marca hoy, que es viernes → RF-2.2 (racha viva todo el día, calculada
  desde el miércoles).
- Hábito de un solo día (`--days dom`) → RF-2.1 (cuenta domingos consecutivos; los otros seis días
  son descanso).
- Hábito con los siete días declarados frente a hábito diario → misma exigencia, distinta
  declaración; RF-2.1 y RF-3 de la spec 001 coinciden día a día.
- `done` en día de descanso → RF-4.1 y RF-4.2 (se registra, avisa, y la racha no cambia).
- `undone` de una marca puesta en día de descanso → la racha tampoco cambia (RF-4.2).

**X veces por semana**

- `--times 3` con marcas el lunes, martes y miércoles → RF-3.2 (la semana en curso ya cuenta, sin
  esperar al domingo).
- `--times 3` con 1 marca y hoy es jueves → RF-3.3 (faltan 2, quedan 4 días: sigue viva; la racha
  muestra solo las semanas cerradas).
- `--times 3` con 1 marca y hoy es sábado → RF-3.4 (faltan 2, queda 1 día contando hoy: imposible,
  racha 0 el mismo sábado).
- `--times 3` con dos `done` el mismo día → RF-3.5 (un día aporta como mucho un cumplimiento).
- `--times 7` → RF-3.1 (equivale a exigir los siete días, pero la racha se cuenta en semanas, no en
  días).
- Semana sin ninguna marca ya cerrada → RF-3.1 (corta la racha aunque las anteriores estuvieran
  cumplidas).

**Cambio de frecuencia y datos**

- Cambio de diario a `--times 2` con un historial irregular → RF-6.2 (la racha se recalcula y puede
  subir).
- Cambio de `--times 2` a diario con huecos → RF-6.2 (la racha se recalcula y puede caer a 0).
- `freq` con la frecuencia que ya tenía → RF-6.3 (cambio sin efecto, salida 0).
- `--days` y `--times` en la misma orden, día repetido, `--times 0` o `--times 8` → RF-1.4.
- Hábito guardado por una versión anterior, sin frecuencia en el archivo → RF-7.2 (se lee como
  diario).
- Archivo con una frecuencia inválida → RF-7.3 (se detiene sin sobrescribir).

## Fuera de alcance

- Frecuencias mensuales, cada N días, o calendarios con excepciones puntuales (vacaciones,
  festivos).
- Congelar o recuperar una racha rota («streak freeze»).
- Marcar días pasados: sigue vigente el fuera de alcance de la spec 001, también para el cupo
  semanal.
- Semana que empiece en un día distinto del lunes, o configurable por el usuario.
- Zona horaria y horario de verano: se mantiene la fecha local del equipo (spec 001).

## Criterios de finalización

- Cada criterio EARS y cada caso límite cubiertos por al menos un test automático, y `npx vitest
  run` en verde, incluidos los de la spec 001 sin modificar.
- Demo manual: `add --days lun,mié,vie` → `list` en día de descanso → `add --times 3` → tres `done`
  en la misma semana → `freq --daily` → `list`, sin errores.

## Dudas abiertas

- **Unidad de la racha mezclada en `list`.** RF-5.4 ordena por valor numérico y empata 3 semanas con
  3 días. Es la regla más simple, pero puede leerse como una comparación injusta. Alternativa
  descartada por ahora: normalizar a días exigidos cumplidos. Revisar tras la primera demo.
