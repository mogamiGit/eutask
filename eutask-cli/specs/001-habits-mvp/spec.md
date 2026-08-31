# Spec 001 — MVP de hábitos

## Contexto y objetivo

`eutask-cli` es una herramienta de línea de comandos para sostener hábitos diarios. Quien quiere consolidar una costumbre necesita dos cosas: apuntar el hecho del día sin fricción y ver la evidencia de su constancia. Las aplicaciones existentes piden cuenta, conexión y navegación por pantallas; el coste de registrar acaba siendo mayor que el del propio hábito.

El objetivo de esta primera funcionalidad es cubrir el ciclo completo mínimo —declarar un hábito, marcarlo cada día y ver la racha— en interacciones de un solo comando, con los datos en el equipo del usuario. La racha es el elemento motivador central: es el número que el usuario no quiere
romper.

## Usuarios

- **Usuario único y local.** Persona con soltura en la terminal, que trabaja a diario en ella y
  quiere registrar sus hábitos sin cambiar de contexto. Gestiona sus propios hábitos en su propio
  equipo; no hay cuentas, roles ni datos compartidos.

## Historias de usuario

- **HU-1.** Como usuario, quiero declarar un hábito nuevo con un nombre descriptivo para empezar a
  seguirlo desde hoy.
- **HU-2.** Como usuario, quiero marcar en un solo comando que hoy he cumplido un hábito, para que
  registrar cueste menos que hacerlo.
- **HU-3.** Como usuario, quiero ver de un vistazo todos mis hábitos, su racha de días consecutivos
  y si hoy ya está hecho, para saber qué me queda por hacer y cuánto llevo acumulado.
- **HU-4.** Como usuario, quiero corregir el nombre de un hábito sin perder su historial ni su
  racha, porque al crearlo no siempre acierto con el enunciado.
- **HU-5.** Como usuario, quiero eliminar un hábito que ya no sigo para que deje de ensuciar la
  lista.
- **HU-6.** Como usuario, quiero retirar la marca de hoy si la he puesto por error, para que la
  racha refleje la verdad y no me quede una constancia que no me he ganado.

## Interfaz

Los criterios de aceptación nombran los comandos con los que el usuario invoca cada operación:

| Comando | Operación |
| --- | --- |
| `eutask add <nombre>` | Crear un hábito |
| `eutask done <id>` | Marcar el hábito como hecho hoy |
| `eutask undone <id>` | Retirar la marca de hoy |
| `eutask list` | Listar los hábitos con su racha y su estado de hoy |
| `eutask rename <id> <nombre>` | Cambiar el nombre de un hábito |
| `eutask remove <id> [--yes]` | Eliminar un hábito y su historial |
| `eutask --help`, `eutask <comando> --help` | Ayuda de uso |

## Requisitos funcionales

### RF-1 — Crear un hábito

El sistema debe permitir crear un hábito a partir de un nombre proporcionado por el usuario.

**Criterios de aceptación (EARS)**

- Cuando el usuario ejecute `eutask add <nombre>` con un nombre válido, el sistema debe
  registrarlo con racha inicial de 0 días, sin ninguna marca de cumplimiento, y confirmar la
  creación indicando el identificador asignado (salida 0).
- El sistema debe recortar los espacios al principio y al final del nombre antes de registrarlo y
  antes de cualquier validación o comparación.
- Si el nombre está vacío o solo contiene espacios, entonces el sistema debe rechazar la creación,
  informar de que el nombre no puede estar vacío y no registrar nada (salida 1).
- Si el nombre ya recortado supera los 60 caracteres, entonces el sistema debe rechazar la
  creación e informar del límite (salida 1). Un nombre de exactamente 60 caracteres se acepta.
- Si el nombre contiene saltos de línea o caracteres de control, entonces el sistema debe rechazar
  la creación e informar de que el nombre debe ser una sola línea de texto (salida 1).
- Si ya existe un hábito con el mismo nombre, entonces el sistema debe rechazar la creación,
  informar del conflicto y no registrar nada (salida 1).

Cubre HU-1.

### RF-2 — Identificación de los hábitos

El sistema debe asignar a cada hábito un identificador numérico único y estable.

**Criterios de aceptación (EARS)**

- Cuando el sistema crea un hábito, debe asignarle un entero positivo mayor que cualquier
  identificador emitido antes en este conjunto de datos.
- El sistema debe recordar entre ejecuciones cuál fue el último identificador emitido, de modo que
  el no-reúso se mantenga aunque se eliminen hábitos.
- El sistema debe mantener el identificador de un hábito invariable durante toda su vida, incluso
  si se renombra el hábito o si se eliminan otros.
- El sistema no debe reutilizar el identificador de un hábito eliminado.

El identificador es el modo en que el usuario señala un hábito concreto en `done`, `undone`,
`rename` y `remove`.

### RF-3 — Comparación de nombres

El sistema debe decidir de forma inequívoca cuándo dos nombres de hábito son el mismo.

**Criterios de aceptación (EARS)**

- El sistema debe considerar iguales dos nombres solo si coinciden carácter a carácter una vez
  recortados los espacios de los extremos.
- El sistema debe distinguir mayúsculas de minúsculas y letras acentuadas de sus equivalentes sin
  acento: `Correr`, `correr` y `corrér` son tres nombres distintos.
- El sistema debe normalizar el nombre a la forma Unicode NFC antes de compararlo y de
  registrarlo, de modo que dos formas de teclear la misma letra acentuada sean el mismo nombre.

Aplica a RF-1 y a RF-8.

### RF-4 — Marcar un hábito como hecho hoy

El sistema debe permitir registrar que un hábito se ha cumplido en el día actual.

**Criterios de aceptación (EARS)**

- Cuando el usuario ejecute `eutask done <id>` sobre un hábito que aún no tenía marca de hoy, el
  sistema debe registrar el cumplimiento en la fecha local actual y confirmar la operación
  mostrando el nombre del hábito y su racha ya actualizada (salida 0).
- Mientras el hábito ya tenga una marca del día actual, el sistema debe informar por la salida
  estándar de que ya estaba marcado, mostrar la racha vigente, no alterar los datos y terminar con
  éxito (salida 0).
- Si el identificador indicado no corresponde a ningún hábito, entonces el sistema debe informar
  de que ese hábito no existe, sugerir consultar `eutask list` y no modificar ningún dato
  (salida 1).
- Si el argumento recibido no es un identificador válido, entonces el sistema debe informar del
  formato esperado y no modificar ningún dato (salida 1).
- El sistema debe registrar como mucho una marca por hábito y día.

Un identificador válido es un entero positivo escrito en base 10, sin signo, sin parte decimal y
sin ceros a la izquierda.

Cubre HU-2.

### RF-5 — Desmarcar un hábito hoy

El sistema debe permitir retirar la marca de cumplimiento del día actual.

**Criterios de aceptación (EARS)**

- Cuando el usuario ejecute `eutask undone <id>` sobre un hábito que tenía marca de hoy, el
  sistema debe eliminar únicamente esa marca y confirmar la operación mostrando el nombre del
  hábito y su racha ya actualizada (salida 0).
- El sistema debe dejar intactas todas las marcas de días anteriores al desmarcar.
- Mientras el hábito no tenga marca del día actual, el sistema debe informar por la salida
  estándar de que hoy no estaba marcado, no alterar los datos y terminar con éxito (salida 0).
- Si el identificador indicado no corresponde a ningún hábito, entonces el sistema debe informar
  de que ese hábito no existe y no modificar ningún dato (salida 1).
- Si el argumento recibido no es un identificador válido, entonces el sistema debe informar del
  formato esperado y no modificar ningún dato (salida 1).
- El sistema no debe pedir confirmación para desmarcar, por tratarse de una acción que solo afecta
  al día en curso y que el usuario puede rehacer marcando de nuevo.

Cubre HU-6. Desmarcar solo actúa sobre hoy: no permite retirar marcas de días pasados.

### RF-6 — Cálculo de la racha

El sistema debe calcular, para cada hábito, su racha de días consecutivos cumplidos.

**Criterios de aceptación (EARS)**

- El sistema debe tomar la fecha local actual como dato de entrada del cálculo: la obtiene la capa
  que atiende el comando y se la entrega al cálculo, que no consulta el reloj por su cuenta.
- Cuando el hábito tiene marca del día actual, el sistema debe contar los días consecutivos con
  marca hacia atrás desde hoy, ambos incluidos.
- Cuando el hábito no tiene marca del día actual pero sí del día anterior, el sistema debe contar
  los días consecutivos con marca hacia atrás desde ayer: la racha sigue viva durante todo el día
  de hoy.
- Cuando el hábito no tiene marca ni de hoy ni de ayer, el sistema debe calcular una racha de 0
  días.
- Cuando un hábito no tiene ninguna marca, el sistema debe calcular una racha de 0 días.
- El sistema debe considerar que un día sin marca, ya transcurrido por completo, rompe la racha.

Cubre HU-3. El día es la fecha local del equipo y cambia a medianoche.

### RF-7 — Listar los hábitos

El sistema debe mostrar todos los hábitos registrados con la información necesaria para decidir
qué hacer hoy.

**Criterios de aceptación (EARS)**

- Cuando el usuario ejecute `eutask list`, el sistema debe mostrar, por cada hábito, su
  identificador, su nombre, su racha actual en días y si ya está cumplido hoy (salida 0).
- El sistema debe ordenar la lista por identificador ascendente.
- Cuando no hay ningún hábito registrado, el sistema debe indicarlo con un mensaje que explique
  cómo crear el primero, y terminar con éxito (salida 0).
- El sistema debe incluir en cada línea una marca textual del estado de hoy —cumplido o
  pendiente— que se conserve aunque la salida se redirija a un archivo o a otro programa.
- El sistema puede reforzar esa marca con color, pero no debe confiar en el color como único medio
  de distinguir lo cumplido de lo pendiente.

Cubre HU-3.

### RF-8 — Renombrar un hábito

El sistema debe permitir cambiar el nombre de un hábito conservando su identificador y su
historial.

**Criterios de aceptación (EARS)**

- Cuando el usuario ejecute `eutask rename <id> <nombre>` sobre un hábito existente con un nombre
  válido, el sistema debe actualizar solo el nombre y confirmar el cambio (salida 0).
- El sistema debe aplicar al nuevo nombre las mismas reglas que RF-1: recorte de espacios, rechazo
  del nombre vacío o solo con espacios, límite de 60 caracteres y rechazo de saltos de línea y
  caracteres de control.
- El sistema debe conservar intactos el identificador, las marcas y, por tanto, la racha del
  hábito renombrado.
- Si el nuevo nombre coincide con el de otro hábito según RF-3, entonces el sistema debe rechazar
  el cambio, informar del conflicto y no modificar ningún dato (salida 1).
- Cuando el nuevo nombre coincide con el nombre actual del propio hábito, el sistema debe aceptar
  la operación como cambio sin efecto y terminar con éxito (salida 0).
- Si el nuevo nombre es inválido por cualquiera de las reglas anteriores, entonces el sistema debe
  rechazar el cambio, informar del motivo y no modificar ningún dato (salida 1).
- Si el identificador indicado no corresponde a ningún hábito, entonces el sistema debe informar
  de que ese hábito no existe y no modificar ningún dato (salida 1).

Cubre HU-4.

### RF-9 — Eliminar un hábito

El sistema debe permitir eliminar un hábito junto con todo su historial.

**Criterios de aceptación (EARS)**

- Cuando el usuario ejecute `eutask remove <id>` sobre un hábito existente y confirme la
  eliminación, el sistema debe borrarlo con todas sus marcas y confirmar la operación (salida 0).
- Mientras el comando se ejecute en un terminal interactivo y no lleve `--yes`, el sistema debe
  pedir una confirmación explícita antes de borrar, por tratarse de una pérdida de datos
  irreversible.
- Cuando el comando lleve `--yes`, el sistema debe borrar sin preguntar, para que la operación
  siga siendo utilizable desde un script.
- Si el comando se ejecuta sin terminal interactivo y sin `--yes`, entonces el sistema debe
  cancelar la operación sin borrar nada e informar de que la eliminación requiere confirmación
  (salida 1).
- Si el usuario no confirma, entonces el sistema debe cancelar la operación sin modificar ningún
  dato e informar de la cancelación (salida 0).
- Si el identificador indicado no corresponde a ningún hábito, entonces el sistema debe informar
  de que ese hábito no existe y no modificar ningún dato (salida 1).
- El sistema debe conservar sin cambios los identificadores de los hábitos restantes.

Cubre HU-5.

### RF-10 — Persistencia entre ejecuciones

El sistema debe conservar los hábitos y sus marcas entre ejecuciones, en el equipo del usuario.

**Criterios de aceptación (EARS)**

- Cuando una operación modifica los datos, el sistema debe guardarlos antes de terminar, de modo
  que la siguiente ejecución los refleje.
- El sistema debe guardar de forma atómica: o quedan escritos todos los cambios de la operación, o
  no queda ninguno. Una interrupción a mitad de la escritura no debe dejar los datos truncados ni
  a medio actualizar.
- Cuando es la primera ejecución y no existen datos previos, el sistema debe partir de un conjunto
  vacío de hábitos sin mostrar ningún error (salida 0).
- Si los datos almacenados están corruptos o no tienen la forma esperada, entonces el sistema debe
  informar del problema y detenerse sin sobrescribirlos (salida 1).
- El sistema no debe enviar los datos a ningún servicio externo ni requerir conexión de red.

### RF-11 — Mensajes y códigos de salida

El sistema debe comunicar el resultado de cada operación de forma inequívoca, tanto a la persona
como a un script.

**Criterios de aceptación (EARS)**

- Cuando una operación termina correctamente, incluidas la de marcar un hábito ya marcado hoy, la
  de desmarcar uno que hoy no lo estaba y la de cancelar una eliminación, el sistema debe terminar
  con código de salida 0.
- Si una operación no puede completarse por un error del usuario o de los datos, entonces el
  sistema debe terminar con código de salida 1 y explicar en español qué ha pasado y cómo
  corregirlo.
- Si el usuario invoca un comando desconocido, entonces el sistema debe informar de ello y mostrar
  los comandos disponibles (salida 1).
- Si el usuario invoca el programa sin ningún comando, entonces el sistema debe mostrar la ayuda de
  uso (salida 1).
- Si a un comando le faltan argumentos o le sobran, entonces el sistema debe informar del uso
  esperado de ese comando y no modificar ningún dato (salida 1).
- Cuando el usuario pide la ayuda con `--help`, el sistema debe mostrar los comandos disponibles y
  su uso, y terminar con éxito (salida 0).
- El sistema debe escribir los mensajes de error en la salida de error y los resultados y avisos
  de operaciones correctas en la salida estándar.
- El sistema debe redactar todos los mensajes al usuario en español.

## Requisitos no funcionales

- **RNF-1 — Inmediatez.** Cualquier comando debe responder en menos de 200 ms, medidos de extremo
  a extremo —arranque del proceso incluido— sobre un conjunto de 100 hábitos con dos años de
  marcas cada uno: registrar debe costar menos que dudar.
- **RNF-2 — Uso local y privado.** Todos los datos residen en el equipo del usuario. Sin cuentas,
  sin telemetría, sin red.
- **RNF-3 — Datos legibles y portables.** El usuario puede abrir, inspeccionar y respaldar sus
  datos con herramientas corrientes, sin depender de la aplicación.
- **RNF-4 — Mensajes accionables.** Todo error dice qué ha fallado y cómo corregirlo, en español y
  sin jerga técnica ni volcados internos.
- **RNF-5 — Un solo usuario a la vez.** El uso concurrente del mismo conjunto de datos desde
  varios procesos queda fuera de alcance; véase esa sección.
- **RNF-6 — Comportamiento determinista.** Dados los mismos datos y la misma fecha de entrada, el
  resultado de cualquier comando es siempre el mismo. La fecha entra como dato (RF-6), de modo que
  un test puede fijarla sin tocar el reloj del equipo.

## Casos límite

1. **Marcar dos veces el mismo día.** Avisa, muestra la racha y termina con éxito; la racha no se
   incrementa dos veces.
2. **Marcar justo antes y después de medianoche.** Dos marcas separadas por el cambio de día
   cuentan como dos días distintos y la racha sube a 2.
3. **Primer día de un hábito.** Al crearlo la racha es 0; al marcarlo por primera vez pasa a 1.
4. **Un día olvidado.** Si transcurre un día completo sin marca, la racha vuelve a 0 y el siguiente
   cumplimiento la reinicia en 1.
5. **Racha viva sin marcar hoy.** Con marcas de ayer y anteayer y hoy pendiente, la racha mostrada
   es 2 y el hábito aparece como no cumplido hoy.
6. **Desmarcar un hábito que hoy no estaba marcado.** Avisa y termina con éxito; los datos quedan
   igual.
7. **Desmarcar devuelve la racha a su valor anterior.** Con marcas de ayer y anteayer y una de hoy,
   la racha es 3; al desmarcar vuelve a ser 2 y el hábito aparece como pendiente hoy.
8. **Marcar, desmarcar y volver a marcar el mismo día.** El estado final es idéntico al de haber
   marcado una sola vez: una marca de hoy y la misma racha.
9. **Desmarcar el primer y único día de un hábito.** El hábito se queda sin ninguna marca y con
   racha 0, como recién creado, pero conserva su identificador y su nombre.
10. **Lista vacía.** Listar sin hábitos no es un error: informa y sugiere crear el primero.
11. **Nombre solo con espacios.** Se trata como nombre vacío y se rechaza.
12. **Nombre duplicado.** Se rechaza al crear y al renombrar.
13. **Nombres que solo difieren en mayúsculas o acentos.** `Correr` y `correr` son dos hábitos
    distintos y ambos pueden coexistir.
14. **Frontera de longitud.** Un nombre de 60 caracteres se acepta; uno de 61 se rechaza. El
    recuento se hace sobre el nombre ya recortado.
15. **Nombre con salto de línea o caracteres de control.** Se rechaza al crear y al renombrar.
16. **Renombrar un hábito a su propio nombre actual.** Se acepta como operación sin efecto y
    termina con éxito.
17. **Renombrar añadiendo o quitando espacios en los extremos.** Tras el recorte, si el resultado
    coincide con el de otro hábito se rechaza; si coincide con el suyo propio es una operación sin
    efecto.
18. **Identificador inexistente o no numérico.** Error explicativo, sin cambios en los datos.
19. **Identificador fuera del formato válido.** `0`, un negativo, un decimal o un número con ceros
    a la izquierda se rechazan como formato inválido.
20. **Argumentos ausentes o sobrantes.** Un comando invocado sin los argumentos que necesita, o con
    más de la cuenta, informa del uso esperado y no toca los datos.
21. **Comando desconocido o invocación sin comando.** Se informa y se muestran los comandos
    disponibles; los datos quedan intactos.
22. **Eliminar sin terminal interactivo y sin `--yes`.** La operación se cancela sin borrar nada.
23. **Eliminar el único hábito.** Deja el conjunto vacío; la siguiente creación no reutiliza el
    identificador liberado.
24. **Interrupción a mitad de una escritura.** Los datos quedan en el estado anterior completo,
    nunca a medio escribir.
25. **Datos inexistentes en la primera ejecución.** No es un error: se parte de cero.
26. **Datos ilegibles o corruptos.** Se informa y se detiene sin sobrescribir, para no perder el
    historial.
27. **Listado redirigido a un archivo.** El estado de cada hábito sigue siendo legible sin color.

## Fuera de alcance

- Marcar o desmarcar días pasados: ambas operaciones actúan solo sobre el día en curso. Una marca
  puesta por error en un día ya cerrado no puede corregirse desde la aplicación; se acepta como
  límite conocido del MVP.
- Zona horaria y horario de verano: el sistema usa siempre la fecha local del equipo, sin
  compensar viajes, cambios de zona ni días de 23 o 25 horas.
- Poda o archivado del historial: las marcas se conservan indefinidamente, sin límite ni
  caducidad.
- Uso concurrente: dos procesos a la vez sobre los mismos datos pueden perder escrituras, y el
  sistema no lo detecta ni lo impide.
- Hábitos con frecuencia distinta de la diaria (x veces por semana, días concretos, descansos).
- Historial detallado, calendario, estadísticas, racha máxima histórica o exportación de informes.
- Archivar o pausar un hábito sin borrarlo.
- Etiquetas, categorías, prioridades, notas, recordatorios o notificaciones.
- Sincronización, cuentas de usuario, multiusuario y cualquier funcionalidad en red.
- Configuración por parte del usuario, incluidos el corte horario del día y la zona horaria.
- Interfaz gráfica o modo interactivo por menús.

## Criterios de finalización

La funcionalidad está terminada cuando:

1. Las seis operaciones —crear, marcar, desmarcar, listar, renombrar y eliminar— se comportan según
   los RF-1 a RF-11.
2. Cada criterio de aceptación EARS tiene al menos un test automático que lo cubre.
3. Todos los casos límite listados están cubiertos por tests.
4. Un usuario nuevo puede, partiendo solo de `eutask --help`, crear un hábito, marcarlo,
   desmarcarlo, ver su racha, renombrarlo y eliminarlo en una sola sesión de terminal.
5. Los datos sobreviven al cierre de la terminal y se recuperan íntegros en la siguiente ejecución.
6. Todos los mensajes al usuario están en español y ningún error muestra un volcado interno.
7. Las operaciones fallidas dejan los datos exactamente como estaban.
8. No quedan dudas abiertas sin resolver ni marcadores `[NECESITA ACLARACIÓN]` en esta spec.

## Dudas abiertas

Ninguna. Las seis dudas iniciales se resolvieron en la clarificación del 2026-08-31:

- **Comparación de nombres duplicados.** Exacta: sensible a mayúsculas y acentos, sobre el nombre
  recortado y normalizado a NFC (RF-3).
- **Límite de longitud del nombre.** 60 caracteres, medidos tras recortar (RF-1).
- **Confirmación de borrado.** Prompt interactivo, con `--yes` para omitirlo desde un script
  (RF-9).
- **Marcas erróneas en días pasados.** Se acepta que no puedan corregirse en el MVP; recogido en
  Fuera de alcance.
- **Cambios de zona horaria.** Se ignoran conscientemente; recogido en Fuera de alcance.
- **Crecimiento del historial.** Sin límite ni poda; recogido en Fuera de alcance.
