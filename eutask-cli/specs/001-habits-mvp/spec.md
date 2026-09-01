# Spec 001 — MVP de hábitos

## Contexto y objetivo

`eutask-cli` es una herramienta de línea de comandos para sostener hábitos diarios. Quien quiere consolidar una costumbre necesita dos cosas: apuntar el hecho del día sin fricción y ver la evidencia de su constancia.

## Usuarios

Desarrolladores con soltura en la terminal, que trabajan a diario en ella y
  quieren registrar sus hábitos sin cambiar de contexto. Gestionar sus propios hábitos en su propio
  equipo; no hay cuentas, roles ni datos compartidos.

## Historias de usuario

- **HU-1.** Como usuario, quiero declarar un hábito nuevo con un nombre descriptivo para empezar a
  seguirlo desde hoy.
- **HU-2.** Como usuario, quiero marcar en un solo comando que hoy he cumplido un hábito, para que
  registrar cueste menos que hacerlo.
- **HU-3.** Como usuario, quiero ver la racha de días consecutivos de cada hábito, para saber
  cuánto llevo acumulado y no romperla.
- **HU-4.** Como usuario, quiero ver de un vistazo todos mis hábitos y si hoy ya están hechos, para
  saber qué me queda por hacer.
- **HU-5.** Como usuario, quiero corregir el nombre de un hábito sin perder su historial ni su
  racha.
- **HU-6.** Como usuario, quiero eliminar un hábito que ya no sigo para que deje de ensuciar la
  lista.
- **HU-7.** Como usuario, quiero retirar la marca de hoy si la he puesto por error, para que la
  racha refleje la verdad.

## Requisitos funcionales (criterios de aceptación EARS)

### RF-1 — Crear un hábito (HU-1)
- RF-1.1: Cuando el usuario ejecute `eutask add <nombre>` con un nombre válido, el sistema debe
  registrarlo con racha inicial de 0 días, sin ninguna marca de cumplimiento, y confirmar la
  creación indicando el identificador asignado (salida 0).
- RF-1.2: El sistema debe recortar los espacios al principio y al final del nombre antes de
  registrarlo y antes de cualquier validación o comparación.
- RF-1.3: Si el nombre está vacío o solo contiene espacios, entonces el sistema debe rechazar la
  creación, informar de que el nombre no puede estar vacío y no registrar nada (salida 1).
- RF-1.4: Si el nombre ya recortado supera los 60 caracteres, entonces el sistema debe rechazar la
  creación e informar del límite (salida 1). Un nombre de exactamente 60 caracteres se acepta.
- RF-1.5: Si el nombre contiene saltos de línea o caracteres de control, entonces el sistema debe
  rechazar la creación e informar de que el nombre debe ser una sola línea de texto (salida 1).
- RF-1.6: Si ya existe un hábito con el mismo nombre, entonces el sistema debe rechazar la creación,
  informar del conflicto y no registrar nada (salida 1). Dos nombres son el mismo solo si coinciden
  carácter a carácter una vez recortados y normalizados a la forma Unicode NFC: la comparación
  distingue mayúsculas de minúsculas y acentos.
- RF-1.7: Cuando el sistema crea un hábito, debe asignarle como identificador un entero positivo
  mayor que cualquiera emitido antes en este conjunto de datos, recordado entre ejecuciones, y no
  debe reutilizar nunca el de un hábito eliminado. El identificador es el modo en que el usuario
  señala un hábito concreto en `done`, `undone`, `rename` y `remove`.
- RF-1.8: Si en cualquiera de esos cuatro comandos el argumento no es un identificador válido —un
  entero positivo en base 10, sin signo, sin parte decimal y sin ceros a la izquierda— o no
  corresponde a ningún hábito, entonces el sistema debe explicar el motivo, sugerir consultar
  `eutask list` y no modificar ningún dato (salida 1).

### RF-2 — Marcar un hábito como hecho hoy (HU-2)
- RF-2.1: Cuando el usuario ejecute `eutask done <id>` sobre un hábito que aún no tenía marca de
  hoy, el sistema debe registrar el cumplimiento en la fecha local actual y confirmar la operación
  mostrando el nombre del hábito y su racha ya actualizada (salida 0).
- RF-2.2: Mientras el hábito ya tenga una marca del día actual, el sistema debe informar por la
  salida estándar de que ya estaba marcado, mostrar la racha vigente, no alterar los datos y
  terminar con éxito (salida 0).

### RF-3 — Cálculo de la racha (HU-3)
- RF-3.1: El sistema debe tomar la fecha local actual como dato de entrada del cálculo: la obtiene
  la capa que atiende el comando y se la entrega al cálculo, que no consulta el reloj por su cuenta.
- RF-3.2: Cuando el hábito tiene marca del día actual, el sistema debe contar los días consecutivos
  con marca hacia atrás desde hoy, ambos incluidos.
- RF-3.3: Cuando el hábito no tiene marca del día actual pero sí del día anterior, el sistema debe
  contar los días consecutivos con marca hacia atrás desde ayer: la racha sigue viva durante todo el
  día de hoy.
- RF-3.4: Cuando el hábito no tiene marca ni de hoy ni de ayer, el sistema debe calcular una racha
  de 0 días. Se rompe la racha.
- RF-3.5: Cuando un hábito no tiene ninguna marca, el sistema debe calcular una racha de 0 días.

### RF-4 — Listar los hábitos (HU-4)
- RF-4.1: Cuando el usuario ejecute `eutask list`, el sistema debe mostrar, por cada hábito, su
  identificador, su nombre, su racha actual en días y si ya está cumplido hoy (salida 0).
- RF-4.2: El sistema debe ordenar de forma descendente (de más a menos) la lista por racha.
- RF-4.3: Cuando no hay ningún hábito registrado, el sistema debe indicarlo con un mensaje que
  explique cómo crear el primero, y terminar con éxito (salida 0).
- RF-4.4: El sistema debe incluir en cada línea una marca textual del estado de hoy —cumplido o
  pendiente— que se conserve aunque la salida se redirija a un archivo o a otro programa. Se puede reforzar este estado con una marca de color.

### RF-5 — Renombrar un hábito (HU-5)
- RF-5.1: Cuando el usuario ejecute `eutask rename <id> <nombre>` sobre un hábito existente con un
  nombre válido, el sistema debe actualizar solo el nombre y confirmar el cambio (salida 0).
- RF-5.2: El sistema debe aplicar al nuevo nombre las mismas reglas de RF-1.2 a RF-1.5: recorte de
  espacios, rechazo del nombre vacío o solo con espacios, límite de 60 caracteres y rechazo de
  saltos de línea y caracteres de control.
- RF-5.3: El sistema debe conservar intactos el identificador, las marcas y, por tanto, la racha del
  hábito renombrado.
- RF-5.4: Si el nuevo nombre coincide con el de otro hábito según RF-1.6, entonces el sistema debe
  rechazar el cambio, informar del conflicto y no modificar ningún dato (salida 1).
- RF-5.5: Cuando el nuevo nombre coincide con el nombre actual del propio hábito, el sistema debe
  aceptar la operación como cambio sin efecto y terminar con éxito (salida 0).

### RF-6 — Eliminar un hábito (HU-6)
- RF-6.1: Cuando el usuario ejecute `eutask remove <id>` sobre un hábito existente y confirme la
  eliminación, el sistema debe borrarlo con todas sus marcas y confirmar la operación (salida 0).
- RF-6.2: Mientras el comando se ejecute en un terminal interactivo y no lleve `--yes`, el sistema
  debe pedir una confirmación explícita antes de borrar, por tratarse de una pérdida de datos
  irreversible.
- RF-6.3: Cuando el comando lleve `--yes`, el sistema debe borrar sin preguntar, para que la
  operación siga siendo utilizable desde un script.
- RF-6.4: Si el comando se ejecuta sin terminal interactivo y sin `--yes`, entonces el sistema debe
  cancelar la operación sin borrar nada e informar de que la eliminación requiere confirmación
  (salida 1).
- RF-6.5: Si el usuario no confirma, entonces el sistema debe cancelar la operación sin modificar
  ningún dato e informar de la cancelación (salida 0).

### RF-7 — Desmarcar un hábito hoy (HU-7)
- RF-7.1: Cuando el usuario ejecute `eutask undone <id>` sobre un hábito que tenía marca de hoy, el
  sistema debe eliminar únicamente esa marca, dejar intactas las de días anteriores y confirmar la
  operación mostrando el nombre del hábito y su racha ya actualizada (salida 0).
- RF-7.2: Mientras el hábito no tenga marca del día actual, el sistema debe informar por la salida
  estándar de que hoy no estaba marcado, no alterar los datos y terminar con éxito (salida 0).

### RF-8 — Persistencia entre ejecuciones
- RF-8.1: El sistema debe almacenar todos los datos en un único archivo JSON local legible por
  humanos.
- RF-8.2: Cuando una operación modifica los datos, el sistema debe guardarlos antes de terminar, de
  modo que la siguiente ejecución los refleje.
- RF-8.3: El sistema debe guardar de forma atómica: o quedan escritos todos los cambios de la
  operación, o no queda ninguno. Una interrupción a mitad de la escritura no debe dejar los datos
  truncados ni a medio actualizar.
- RF-8.4: Cuando es la primera ejecución y no existen datos previos, el sistema debe partir de un
  conjunto vacío de hábitos sin mostrar ningún error (salida 0).
- RF-8.5: Si los datos almacenados están corruptos o no son JSON válido, entonces el sistema debe
  informar del problema y detenerse sin sobrescribirlos (salida 1).

## Requisitos no funcionales

- **RNF-1 — Respuesta inmediata (<1 s)** en equipos modestos. Sin acceso a red.
- **RNF-2 — Mensajes accionables.** Todo error dice qué ha fallado y cómo corregirlo, en español y
  sin jerga técnica ni volcados internos.
- **RNF-3 — Un solo usuario a la vez.** El uso concurrente del mismo conjunto de datos desde varios
  procesos queda fuera de alcance.

## Casos límite ya cubiertos

- Primer `done` de un hábito recién creado → RF-3.2 (la racha pasa de 0 a 1).
- Racha con hueco de un día completo → RF-3.4 (racha 0; el siguiente `done` la reinicia en 1).
- Hecho ayer pero aún no hoy → RF-3.3 (la racha se conserva y hoy figura pendiente).
- Doble `done` el mismo día → RF-2.2.
- `undone` de un hábito no marcado hoy → RF-7.2.
- `done`, `undone` y `done` el mismo día → RF-2.1 y RF-7.1 (estado final: una sola marca).
- `undone` de la única marca de un hábito → RF-3.5 (racha 0, conserva id y nombre).
- Nombres que solo difieren en mayúsculas o acentos → RF-1.6 (coexisten).
- Nombre de 60 caracteres frente a uno de 61 → RF-1.4 (se mide tras el recorte de RF-1.2).
- Renombrar añadiendo o quitando espacios en los extremos → RF-5.4 y RF-5.5.
- Identificador inexistente o mal formado (`0`, negativo, decimal, `007`) → RF-1.8.
- `remove` sin terminal interactivo y sin `--yes` → RF-6.4 (no borra nada).
- Eliminar el único hábito → RF-1.7 (la siguiente creación no reutiliza su identificador).
- Archivo de datos inexistente → RF-8.4 (se parte de un conjunto vacío).
- Archivo de datos corrupto → RF-8.5.

## Fuera de alcance

- Marcar o desmarcar días pasados: ambas operaciones actúan solo sobre el día en curso.
- Zona horaria y horario de verano: el sistema usa siempre la fecha local del equipo, sin compensar
  viajes, cambios de zona ni días de 23 o 25 horas.
- Poda o archivado del historial: las marcas se conservan indefinidamente, sin límite ni caducidad.
- Hábitos con frecuencia distinta de la diaria (x veces por semana, días concretos, descansos).
- Sincronización, cuentas de usuario, multiusuario y cualquier funcionalidad en red.

## Criterios de finalización

- Cada criterio EARS y cada caso límite cubiertos por al menos un test automático, y `npx vitest
  run` en verde.
- Demo manual, partiendo solo de `eutask --help`: add → done → list → rename → undone → remove sin
  errores.

## Dudas abiertas

Las seis dudas iniciales se resolvieron en la clarificación. Queda una, abierta en T14:

- `done` y `undone` tienen la misma estructura y solo difieren en la función del núcleo, la bandera
  de no-op y los dos mensajes. ¿Compensa unificarlas? Unificarlas obliga a normalizar
  `alreadyMarked` y `wasNotMarked` y a encajar `wasNotMarkedToday`, que no lleva racha, y la
  abstracción solo tendría dos usuarios: `rename` y `remove` no entran en ese molde. Se decide en
  el cierre (T17).
