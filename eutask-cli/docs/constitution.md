# Constitución — eutask-cli

Reglas innegociables. Un cambio que incumpla cualquiera de ellas no se acepta.

1. **Simplicidad primero.** Node 20+ y TypeScript con `strict: true`. Un solo concepto de dominio: el hábito con su registro diario. En la aplicación, solo `commander`, `chalk`, `date-fns` y `zod`; cualquier otra dependencia exige una spec aprobada.
2. **La spec manda.** Todo cambio de comportamiento empieza en `specs/`. Si el código y la spec discrepan, gana la spec y se corrige el código.
3. **Núcleo puro.** `src/core.ts` no importa `fs`, `process`, `chalk` ni `commander`: recibe datos y devuelve datos. La CLI solo parsea entrada, llama al núcleo e imprime.
4. **Tests siempre.** Cada función del núcleo tiene test en `vitest`; cada bug empieza por un test que falla. `npx vitest run` debe pasar antes de cada commit.
5. **Persistencia simple y explícita.** Un único JSON en `~/.eutask/data.json`, escrito solo desde `src/storage.ts` y validado con `zod` al leer. Cambiar su formato exige actualizar la spec y migrar los datos existentes.
6. **Idioma.** Identificadores, tipos y comentarios en inglés; mensajes al usuario y documentación en español. Sin mezclas.
