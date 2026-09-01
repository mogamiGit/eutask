# Tareas — Spec 001

Detalle de diseño en `plan.md`. Orden de dependencia; `npx vitest run` en verde al cerrar cada una.

- [x] T1. Andamiaje: `package.json` (`bin.eutask` → `dist/cli.js`), `tsconfig` estricto, vitest,
      deps `commander`/`chalk`/`date-fns`/`zod`. (RF: —)
      Hecho cuando: `npx tsc --noEmit` y `npx vitest run` corren sin errores.
- [x] T2. core: tipos, `emptyDatabase`, `normalizeName`, `validateName`, `parseHabitId`.
      (RF-1.2..1.5, RF-1.8, RF-8.4)
      Hecho cuando: tests de vacío, 59/60/61, control, NFC vs NFD, e ids `0`/`-1`/`007`/`1.5` en verde.
- [ ] T3. core.computeStreak con `today` inyectado. (RF-3)
      Hecho cuando: tests de sin marcas, solo hoy, viva por ayer, hueco y racha larga en verde.
- [ ] T4. core.addHabit: id de `nextId`, duplicado exacto rechazado. (RF-1.1, RF-1.6, RF-1.7)
      Hecho cuando: tests de creación, duplicado, variantes por acentos y mayúsculas, y `nextId` en verde.
- [ ] T5. core.markDone y markUndone, idempotentes. (RF-2, RF-7)
      Hecho cuando: tests de primera marca, repetida, done→undone→done y días anteriores en verde.
- [ ] T6. core.renameHabit y removeHabit. (RF-5, RF-6.1)
      Hecho cuando: tests de renombrado, conflicto, nombre idéntico, borrado sin reutilizar id en verde.
- [ ] T7. core.listHabits ordenado + invariante de no mutación. (RF-4.1, RF-4.2)
      Hecho cuando: test de orden por racha y desempate por id, y test que congela el `db` en verde.
- [ ] T8. storage.resolveDataPath y loadDatabase con zod. (RF-8.1, RF-8.4, RF-8.5)
      Hecho cuando: tests de `$EUTASK_HOME`, archivo ausente, JSON roto y fuera de esquema en verde.
- [ ] T9. storage.saveDatabase atómico (tmp + fsync + rename). (RF-8.2, RF-8.3)
      Hecho cuando: guardar y releer da lo mismo, JSON a 2 espacios y sin `.tmp` residual.
- [ ] T10. output.ts: mensajes en español y tabla de `list`. (RF-4.1, RF-4.3, RF-4.4, RNF-2)
      Hecho cuando: cada `ErrorCode` tiene texto accionable y `[x] hecho`/`[ ] pendiente` sobreviven sin ANSI.
- [ ] T11. confirm.ts con `node:readline` e `isTTY`. (RF-6.2, RF-6.4)
      Hecho cuando: solo la respuesta afirmativa explícita devuelve `true`.
- [ ] T12. cli.ts con commander: seis comandos, `today` local, códigos de salida. (RF-1.1, RF-3.1)
      Hecho cuando: `npm run build` y `node dist/cli.js --help` sale 0 listando los seis.
- [ ] T13. Comandos `add` y `list`. (RF-1, RF-4, RF-8.2)
      Hecho cuando: `add` válido sale 0 con el id, inválido sale 1 sin tocar el archivo, `list` vacío sale 0.
- [ ] T14. Comandos `done` y `undone`. (RF-2, RF-7, RF-1.8)
      Hecho cuando: éxito y no-op salen 0, id inexistente sale 1 sugiriendo `eutask list`.
- [ ] T15. Comandos `rename` y `remove --yes`. (RF-5, RF-6)
      Hecho cuando: `--yes` borra y sale 0; sin TTY y sin `--yes` sale 1 sin borrar; conflicto sale 1.
- [ ] T16. E2E: helper `run()` con `mkdtemp` + un caso por fila de la tabla del plan. (RF-1..RF-8, RNF-2)
      Hecho cuando: cada fila tiene test que verifica código de salida y stdout/stderr.
- [ ] T17. Cierre: datos corruptos en los seis comandos, demo completa y checklist de la spec. (Todos)
      Hecho cuando: cada criterio EARS y caso límite tiene test, y la demo manual corre sin errores.
