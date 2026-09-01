// Every text the user reads, in Spanish (constitution, "Idioma"). The core and the storage
// return codes; the wording lives here, so no test is tied to a sentence (D-6).

import chalk from 'chalk';

import type { ErrorCode, Habit, HabitView } from './core.js';
import type { LoadErrorCode } from './storage.js';

/** Where to look when the user needs to see the identifiers (RF-1.8). */
const CHECK_YOUR_HABITS = 'Consulta tus hábitos con: eutask list';

const ERROR_TEXTS: Record<ErrorCode, string> = {
  EMPTY_NAME:
    'El nombre no puede estar vacío. Escríbelo entre comillas, por ejemplo: eutask add "Leer 20 páginas"',
  NAME_TOO_LONG: 'El nombre no puede pasar de 60 caracteres. Acórtalo e inténtalo de nuevo.',
  NAME_NOT_SINGLE_LINE:
    'El nombre debe ser una sola línea de texto, sin saltos de línea ni tabuladores.',
  DUPLICATE_NAME: `Ya existe otro hábito con ese nombre. Elige uno distinto. ${CHECK_YOUR_HABITS}`,
  INVALID_ID: `El identificador debe ser un número entero positivo, sin signo, sin decimales y sin ceros a la izquierda. ${CHECK_YOUR_HABITS}`,
  HABIT_NOT_FOUND: `No existe ningún hábito con ese identificador. ${CHECK_YOUR_HABITS}`,
};

const LOAD_ERROR_TEXTS: Record<LoadErrorCode, string> = {
  INVALID_JSON: 'El archivo de datos no contiene JSON válido',
  INVALID_SCHEMA: 'El archivo de datos no tiene el formato que espera eutask',
};

/** RNF-2: what went wrong and what to do about it. */
export const errorText = (code: ErrorCode): string => ERROR_TEXTS[code];

/** RF-8.5: names the file and makes clear that nothing was written on it. */
export const loadErrorText = (code: LoadErrorCode, path: string): string =>
  `${LOAD_ERROR_TEXTS[code]}: ${path}\nNo se ha modificado. Revísalo o muévelo de sitio para empezar de cero.`;

/** '1 día' but '0 días' and '2 días'. */
const days = (streak: number): string => (streak === 1 ? '1 día' : `${streak} días`);

const quoted = (name: string): string => `«${name}»`;

export const habitCreated = (habit: Habit): string =>
  `Hábito creado: ${quoted(habit.name)} (id ${habit.id}).`;

export const markedDone = (name: string, streak: number): string =>
  `Hecho: ${quoted(name)}. Racha: ${days(streak)}.`;

export const alreadyDoneToday = (name: string, streak: number): string =>
  `${quoted(name)} ya estaba marcado hoy. Racha: ${days(streak)}.`;

export const markWithdrawn = (name: string, streak: number): string =>
  `Marca de hoy retirada en ${quoted(name)}. Racha: ${days(streak)}.`;

export const wasNotMarkedToday = (name: string): string =>
  `${quoted(name)} no estaba marcado hoy.`;

export const habitRenamed = (id: number, name: string): string =>
  `Hábito ${id} renombrado a ${quoted(name)}.`;

export const renameUnchanged = (id: number): string =>
  `El hábito ${id} ya se llamaba así. No hay cambios.`;

export const confirmRemoval = (name: string): string =>
  `¿Eliminar ${quoted(name)} y todo su historial? [s/N] `;

export const habitRemoved = (id: number): string => `Hábito ${id} eliminado.`;

export const removalCancelled = (): string => 'Operación cancelada. No se ha borrado nada.';

export const removalNeedsConfirmation = (): string =>
  'Eliminar requiere confirmación. Vuelve a ejecutarlo con --yes.';

export const noHabitsYet = (): string =>
  'No tienes hábitos todavía. Crea el primero con: eutask add "<nombre>"';

const DONE = '[x] hecho';
const PENDING = '[ ] pendiente';

// Minimum widths, so the usual table always looks the same; they grow with the content.
const ID_WIDTH = 5;
const STATE_WIDTH = 15;
const STREAK_WIDTH = 10;

const columnWidth = (minimum: number, cells: string[]): number =>
  Math.max(minimum, ...cells.map((cell) => cell.length + 2));

/**
 * RF-4.1 and RF-4.2: one line per habit, in the order the core gives them. RF-4.4: the state
 * travels as text —'[x] hecho' or '[ ] pendiente'— and the colour only reinforces it, so a
 * redirected output keeps saying the same thing.
 */
export const habitsTable = (habits: HabitView[]): string => {
  const idWidth = columnWidth(
    ID_WIDTH,
    habits.map((each) => String(each.id)),
  );
  const stateWidth = columnWidth(STATE_WIDTH, [DONE, PENDING]);
  const streakWidth = columnWidth(
    STREAK_WIDTH,
    habits.map((each) => days(each.streak)),
  );

  const header = chalk.bold(
    `${'ID'.padEnd(idWidth)}${'ESTADO'.padEnd(stateWidth)}${'RACHA'.padEnd(streakWidth)}HÁBITO`,
  );

  const rows = habits.map((habit) => {
    const state = habit.doneToday ? DONE : PENDING;
    // The padding stays outside the colour, so the width does not depend on the escape codes.
    const painted = habit.doneToday ? chalk.green(state) : chalk.yellow(state);

    return [
      String(habit.id).padEnd(idWidth),
      painted,
      ' '.repeat(stateWidth - state.length),
      days(habit.streak).padEnd(streakWidth),
      habit.name,
    ].join('');
  });

  return [header, ...rows].join('\n');
};
