# Plan técnico — Spec 001

Diseño técnico de la spec `001-habits-mvp`. Si plan y spec discrepan, gana la spec (constitución §2).

## 1. Módulos

```
src/
  core.ts        núcleo puro: dominio, validación, racha, operaciones   RF-1.2..1.8, 2, 3, 4.1, 4.2, 5, 6.1, 7
  storage.ts     único acceso a disco: ruta, zod al leer, save atómico  RF-8
  cli.ts         commander, bin, fecha de hoy, código de salida         RF-1.1, 3.1
  commands/*.ts  add done undone list rename remove — sin dominio       (cada RF en su comando)
  output.ts      textos en español, tabla de list, chalk                RF-4.1, 4.3, 4.4, RNF-2
  confirm.ts     readline + process.stdin.isTTY                         RF-6.2, 6.4
tests/
  core.test.ts  storage.test.ts  cli.e2e.test.ts  helpers/run.ts
```

Flujo: `argv → cli → commands/X → storage.load → core.op(db, …, today) → storage.save → output → exit`.
`core.ts` no importa `fs`, `process`, `chalk` ni `commander` (constitución §3).

### API del núcleo

Identificadores en inglés. `today` siempre entra como parámetro: el núcleo no lee el reloj (RF-3.1).

```ts
type IsoDate  = string;   // 'YYYY-MM-DD' local, nunca instante UTC
type Habit    = { id: number; name: string; createdAt: IsoDate; marks: IsoDate[] };
type Database = { version: 1; nextId: number; habits: Habit[] };
type ErrorCode = 'EMPTY_NAME' | 'NAME_TOO_LONG' | 'NAME_NOT_SINGLE_LINE'
               | 'DUPLICATE_NAME' | 'INVALID_ID' | 'HABIT_NOT_FOUND';
type Result<T> = { ok: true; value: T } | { ok: false; code: ErrorCode };

normalizeName(raw): string                    // trim + NFC            RF-1.2, 1.6
validateName(raw): Result<string>             //                       RF-1.3, 1.4, 1.5, 5.2
parseHabitId(raw): Result<number>             //                       RF-1.8
computeStreak(marks, today): number           //                       RF-3.1..3.5
isDoneToday(habit, today): boolean            //                       RF-4.1
emptyDatabase(): Database                     //                       RF-8.4
addHabit(db, rawName, today):   Result<{ db; habit }>                // RF-1.1..1.7
markDone(db, id, today):        Result<{ db; habit; streak; alreadyMarked }>  // RF-2.1, 2.2
markUndone(db, id, today):      Result<{ db; habit; streak; wasNotMarked }>   // RF-7.1, 7.2
renameHabit(db, id, rawName):   Result<{ db; habit; unchanged }>     // RF-5.1..5.5
removeHabit(db, id):            Result<{ db; habit }>                // RF-6.1
listHabits(db, today): HabitView[]                                   // RF-4.1, 4.2
```

Ninguna operación muta el `Database` recibido: todas devuelven uno nuevo.

**Validación del nombre** (RF-1.2..1.5, RF-5.2), en este orden porque el resultado depende de él:
trim → NFC → vacío `EMPTY_NAME` → contiene `/\p{Cc}/u` `NAME_NOT_SINGLE_LINE` → `[...name].length > 60`
`NAME_TOO_LONG` (60 se acepta). Se almacena el nombre ya normalizado, así RF-1.6 es igualdad estricta
de cadenas y distingue mayúsculas y acentos sin código extra.

**Identificadores** (RF-1.7, RF-1.8): `nextId` se persiste y solo crece; borrar no lo toca, así que
nunca se reutiliza. `parseHabitId` acepta solo `/^[1-9][0-9]*$/` — rechaza `0`, `-1`, `1.5`, `007`,
`1e3`, `" 1 "`, `abc`.

## 2. Modelo de datos

Un único JSON legible (RF-8.1), indentado a 2 espacios. Ruta: `~/.eutask/data.json`, o
`$EUTASK_HOME/data.json` si esa variable existe (D-11).

```json
{
  "version": 1,
  "nextId": 4,
  "habits": [
    { "id": 1, "name": "Leer 20 páginas", "createdAt": "2026-08-25",
      "marks": ["2026-08-30", "2026-08-31", "2026-09-01"] },
    { "id": 2, "name": "Correr 5 km", "createdAt": "2026-08-28",
      "marks": ["2026-08-29", "2026-08-31"] },
    { "id": 3, "name": "Meditar", "createdAt": "2026-09-01", "marks": [] }
  ]
}
```

- `version`: cambiarlo exige actualizar la spec y migrar (constitución §5).
- `nextId`: siguiente id a emitir, monótono creciente (RF-1.7). Es 4 aunque se borren los tres.
- `marks`: fechas locales cumplidas, ascendentes y sin duplicados.

Con `today = 2026-09-01`: hábito 1 → racha 3, hecho hoy (RF-3.2); hábito 2 → racha 1 y pendiente,
porque tiene marca de ayer y el hueco del 30 corta el conteo (RF-3.3); hábito 3 → racha 0 (RF-3.5).

**Lectura** (`storage.ts`): archivo ausente → `emptyDatabase()`, sin error (RF-8.4). Presente → parsear
y validar con `zod` (`version: z.literal(1)`, ids enteros positivos, fechas `/^\d{4}-\d{2}-\d{2}$/`).
Fallo de parseo o de esquema → salida 1 sin escribir nada (RF-8.5).

**Escritura**: crear el directorio si falta, escribir `data.json.tmp` en él, `fsync`, `rename` encima.
El `rename` en el mismo sistema de archivos es atómico, así que nunca queda truncado (RF-8.3). Se
guarda solo si hubo cambios, y siempre antes de terminar (RF-8.2).

## 3. Racha (RF-3)

```
FUNCIÓN computeStreak(marks, today) → entero
  SI marks vacío → DEVOLVER 0                    // RF-3.5
  marked ← conjunto de marks

  SI today ∈ marked        → cursor ← today      // RF-3.2: cuenta incluyendo hoy
  SI NO SI today−1 ∈ marked → cursor ← today−1   // RF-3.3: viva todo el día de hoy
  SI NO                     → DEVOLVER 0         // RF-3.4: rota

  streak ← 0
  MIENTRAS cursor ∈ marked
    streak ← streak + 1
    cursor ← cursor − 1 día
  DEVOLVER streak
```

`today` llega como parámetro (RF-3.1). Restar días con `subDays`+`parseISO`+`format` de `date-fns`,
nunca aritmética de milisegundos: se rompería en los cambios de horario de verano. El bucle da como
mucho tantas vueltas como marcas haya.

Casos límite de la spec: `[hoy]`→1 · `[hoy−3,hoy−2]`→0 · `[hoy−2,hoy−1]`→2 y pendiente · `[]`→0 ·
`done`+`undone`+`done` el mismo día → 1 con una sola marca (RF-2.1, RF-7.1).

## 4. Contrato de la CLI

Resultados a **stdout**, errores a **stderr**, en español y diciendo cómo corregir (RNF-2).
Salida **0** = terminó como se esperaba, incluidos los no-ops (RF-2.2, 4.3, 5.5, 6.5, 7.2).
Salida **1** = entrada inválida, hábito inexistente, conflicto, datos corruptos o RF-6.4; los datos
quedan intactos. `--help`/`--version` → 0; comando o argumento incorrecto → `commander` sale con 1.

| Comando | Caso | Mensaje | Cód. | RF |
|---|---|---|:--:|---|
| `add <nombre>` | ok | `Hábito creado: «Leer 20 páginas» (id 1).` | 0 | 1.1 |
| | vacío / >60 / con control / duplicado | mensaje propio de cada regla | 1 | 1.3–1.6 |
| `done <id>` | ok | `Hecho: «X». Racha: 3 días.` | 0 | 2.1 |
| | ya marcado | `«X» ya estaba marcado hoy. Racha: 3 días.` | 0 | 2.2 |
| `undone <id>` | ok | `Marca de hoy retirada en «X». Racha: 2 días.` | 0 | 7.1 |
| | no marcado | `«X» no estaba marcado hoy.` | 0 | 7.2 |
| `list` | ok | tabla (abajo) | 0 | 4.1, 4.2, 4.4 |
| | sin hábitos | `No tienes hábitos todavía. Crea el primero con: eutask add "<nombre>"` | 0 | 4.3 |
| `rename <id> <nombre>` | ok | `Hábito 1 renombrado a «Y».` | 0 | 5.1, 5.3 |
| | nombre idéntico | `El hábito 1 ya se llamaba así. No hay cambios.` | 0 | 5.5 |
| | choca con otro | `Ya existe otro hábito con ese nombre.` | 1 | 5.4 |
| | nombre inválido | mensajes de RF-1.3/1.4/1.5 | 1 | 5.2 |
| `remove <id> [--yes]` | con TTY, sin `--yes` | `¿Eliminar «X» y todo su historial? [s/N]` | — | 6.2 |
| | confirmado o `--yes` | `Hábito 1 eliminado.` | 0 | 6.1, 6.3 |
| | respuesta negativa | `Operación cancelada. No se ha borrado nada.` | 0 | 6.5 |
| | sin TTY y sin `--yes` | `Eliminar requiere confirmación. Vuelve a ejecutarlo con --yes.` | 1 | 6.4 |

Comunes a `done`/`undone`/`rename`/`remove`, salida 1 (RF-1.8): id mal formado o inexistente →
motivo + `Consulta tus hábitos con: eutask list`. En cualquier comando, datos dañados → salida 1
indicando la ruta y que el archivo no se ha modificado (RF-8.5).

```
ID   ESTADO         RACHA     HÁBITO
1    [x] hecho      3 días    Leer 20 páginas
2    [ ] pendiente  1 día     Correr 5 km
3    [ ] pendiente  0 días    Meditar
```

Orden: racha descendente y, a igualdad, id ascendente para que la salida sea determinista (RF-4.2 y
su desempate). El estado va siempre como texto, así sobrevive a una redirección; el color de `chalk`
lo refuerza pero nunca es el único portador (RF-4.4). `<nombre>` es un solo argumento:
`eutask add "Leer 20 páginas"`.

## 5. Decisiones técnicas

**D-1. Fechas como `YYYY-MM-DD` local, no instantes.** El dominio compara días; así la comparación es
igualdad de cadenas. *Descartado:* epoch o ISO con hora — reintroduce la zona horaria, fuera de alcance.

**D-2. `today` entra como parámetro.** *Descartado:* `new Date()` dentro del núcleo — ataría los tests
al día de ejecución. Además RF-3.1 lo exige.

**D-3. `marks` array en disco, `Set` en memoria.** Legible y diffeable fuera, O(1) dentro.
*Descartado:* mapa `{"2026-09-01": true}` — más grande, sin orden y con un booleano siempre `true`.

**D-4. Escritura `tmp` + `fsync` + `rename`.** *Descartado:* `writeFileSync` directo — una interrupción
deja el archivo truncado, justo lo que RF-8.3 prohíbe.

**D-5. El núcleo devuelve `Result`, no lanza.** Los errores de dominio son resultados esperados y
quedan en la firma. *Descartado:* excepciones — mezclan control de flujo con fallos reales.

**D-6. Códigos de error en el núcleo, textos en español en `output.ts`.** *Descartado:* devolver la
frase desde el núcleo — rompe constitución §3 y §6 y ata los tests a la redacción.

**D-7. `nextId` persistido.** *Descartado:* `max(id)+1` — al borrar el último hábito reutilizaría su
id, que es lo que RF-1.7 prohíbe.

**D-8. Longitud en puntos de código (`[...name].length`).** *Descartado:* `.length` UTF-16 — un emoji
contaría doble y el límite de 60 sería arbitrario (RF-1.4).

**D-9. `zod` solo en la lectura del archivo.** Nombres e ids son dominio y se validan en `core.ts`.
*Descartado:* `zod` dentro del núcleo — le mete una dependencia y traslada los mensajes a la librería.

**D-10. Confirmación con `node:readline` + `isTTY`.** *Descartado:* `inquirer`/`prompts` — la
constitución §1 limita las dependencias a cuatro y un sí/no no justifica una spec.

**D-11. `~/.eutask/data.json`, redirigible con `$EUTASK_HOME`.** Patrón habitual (`GH_CONFIG_DIR`,
`DOCKER_CONFIG`). *Descartado:* ruta fija + `vi.mock('node:fs')` — deja RF-8.3 sin verificar de verdad
y los e2e escribirían en el home real.

**D-12. `tsc` a `dist/`, `bin` → `dist/cli.js`.** *Descartado:* `tsx`/`ts-node` — cientos de ms de
arranque por invocación y RNF-1 pide menos de 1 s.

**D-13. `version` en el JSON desde el día uno.** *Descartado:* añadirlo cuando haga falta — el primer
cambio de formato encontraría archivos indistinguibles y §5 exige migrarlos.

## 6. Tests

`vitest`; `npx vitest run` en verde antes de cada commit (constitución §4). Cada bug empieza por un
test que falla, en el nivel más bajo que lo reproduzca.

**Núcleo** (`core.test.ts`) — funciones puras, fecha fija `2026-09-01`, sin disco ni reloj:
`computeStreak` (sin marcas, solo hoy, racha de 3 hasta hoy, racha hasta ayer, hueco, marca futura);
`validateName` (vacío, solo espacios, 59/60/61 tras el trim, `\n`, `\t`, control, emoji, NFC vs NFD);
`parseHabitId` (`1`, `42` · `0`, `-1`, `1.5`, `007`, `1e3`, `""`, `" 1 "`, `abc`); `addHabit` (id
emitido, racha 0, duplicado exacto, variantes por mayúsculas y acentos, `nextId` tras un `remove`);
`markDone`/`markUndone` (primera marca, repetida, done→undone→done, undone sin marca, días anteriores
intactos); `renameHabit` (válido, conflicto, idéntico, solo espacios, id y marcas intactos);
`removeHabit`. Invariante transversal: ninguna operación muta el `db` de entrada.

**Persistencia** (`storage.test.ts`) — `mkdtemp` real apuntado por `EUTASK_HOME`, sin mocks: archivo
ausente → vacío; guardar y releer; JSON indentado; JSON inválido y JSON válido que incumple el esquema
→ error y archivo idéntico byte a byte; tras guardar no queda ningún `.tmp`; `resolveDataPath` con y
sin la variable.

**Extremo a extremo** (`cli.e2e.test.ts`) — lanza el binario con `node:child_process` y un tmpdir por
test; único nivel que ve códigos de salida y ausencia de TTY:

```ts
// tests/helpers/run.ts — sin dependencias nuevas
run(args: string[], home: string): Promise<{ stdout: string; stderr: string; code: number }>
```

Un caso por cada salida 0 y 1 de la tabla anterior; `remove` sin TTY ni `--yes` → 1 y el hábito sigue
ahí (RF-6.4); `remove --yes` → 0; `add` en un proceso y `list` en otro (RF-8.2); `list` capturado
conserva la marca textual sin códigos de color (RF-4.4); demo completa `add → done → list → rename →
undone → remove`; `--help` y `--version` → 0.

| RF | Núcleo | Storage | E2E |
|---|:--:|:--:|:--:|
| RF-1 crear · RF-2 done · RF-3 racha · RF-4 list · RF-5 rename · RF-7 undone | ✓ | | ✓ |
| RF-6 eliminar | ✓ (6.1) | | ✓ (6.2–6.5) |
| RF-8 persistencia | | ✓ | ✓ (8.2) |

RNF-1 (<1 s) lo sostiene el diseño —un archivo local, sin red— y se comprueba en la demo manual.
RNF-2 se verifica en los e2e: cada error incluye cómo corregirlo. RNF-3 queda fuera de alcance.
