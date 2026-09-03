import { describe, expect, it } from 'vitest';

import type { ErrorCode, HabitView } from '../src/core.js';
import type { LoadErrorCode } from '../src/storage.js';
import {
  alreadyDoneToday,
  confirmRemoval,
  errorText,
  habitCreated,
  habitRemoved,
  habitRenamed,
  habitsTable,
  loadErrorText,
  markWithdrawn,
  markedDone,
  noHabitsYet,
  removalCancelled,
  removalNeedsConfirmation,
  renameUnchanged,
  wasNotMarkedToday,
} from '../src/output.js';

// T10 — every user facing text lives here, in Spanish (constitution, "Idioma"). RF-4.1, RF-4.3,
// RF-4.4 and RNF-2: an error says what went wrong and how to fix it.

const ERROR_CODES: ErrorCode[] = [
  'EMPTY_NAME',
  'NAME_TOO_LONG',
  'NAME_NOT_SINGLE_LINE',
  'DUPLICATE_NAME',
  'INVALID_ID',
  'HABIT_NOT_FOUND',
];

const LOAD_ERROR_CODES: LoadErrorCode[] = ['INVALID_JSON', 'INVALID_SCHEMA'];

/** What a terminal shows once the colour codes are gone, as when the output is redirected. */
const withoutAnsi = (text: string): string => text.replace(/\[[0-9;]*m/g, '');

const view = (id: number, name: string, streak: number, doneToday: boolean): HabitView => ({
  id,
  name,
  streak,
  doneToday,
});

describe('error messages (RNF-2)', () => {
  it.each(ERROR_CODES)('%s says what went wrong', (code) => {
    const text = errorText(code);

    expect(text.length).toBeGreaterThan(0);
    // Plain Spanish, no internal names leaking to the user.
    expect(text).not.toContain(code);
    expect(text).not.toMatch(/undefined|null|Error:/);
  });

  it('explains how to fix a name that is empty, too long or not a single line', () => {
    expect(errorText('EMPTY_NAME')).toContain('vacío');
    expect(errorText('NAME_TOO_LONG')).toContain('60');
    expect(errorText('NAME_NOT_SINGLE_LINE')).toContain('una sola línea');
  });

  it('points to eutask list when the problem is the identifier (RF-1.8)', () => {
    expect(errorText('INVALID_ID')).toContain('eutask list');
    expect(errorText('HABIT_NOT_FOUND')).toContain('eutask list');
  });

  it('reports the clash of names without naming the internals (RF-1.6, RF-5.4)', () => {
    expect(errorText('DUPLICATE_NAME')).toContain('Ya existe');
  });

  it.each(LOAD_ERROR_CODES)('%s names the file and says it was left alone (RF-8.5)', (code) => {
    const text = loadErrorText(code, '/home/quien/.eutask/data.json');

    expect(text).toContain('/home/quien/.eutask/data.json');
    expect(text).toContain('No se ha modificado');
  });

  it('tells apart broken JSON from a file of another shape', () => {
    const path = '/tmp/data.json';

    expect(loadErrorText('INVALID_JSON', path)).not.toBe(loadErrorText('INVALID_SCHEMA', path));
  });
});

describe('confirmations of each command', () => {
  it('confirms the creation with the name and the id (RF-1.1)', () => {
    expect(habitCreated({ id: 1, name: 'Leer 20 páginas', createdAt: '2026-09-01', marks: [] })).toBe(
      'Hábito creado: «Leer 20 páginas» (id 1).',
    );
  });

  it('confirms the mark of today with the updated streak (RF-2.1)', () => {
    expect(markedDone('Leer 20 páginas', 3)).toBe('Hecho: «Leer 20 páginas». Racha: 3 días.');
  });

  it('says the habit was already marked, with the streak in force (RF-2.2)', () => {
    expect(alreadyDoneToday('Leer 20 páginas', 3)).toBe(
      '«Leer 20 páginas» ya estaba marcado hoy. Racha: 3 días.',
    );
  });

  it('confirms the withdrawal of the mark of today (RF-7.1)', () => {
    expect(markWithdrawn('Correr 5 km', 2)).toBe(
      'Marca de hoy retirada en «Correr 5 km». Racha: 2 días.',
    );
  });

  it('says the habit was not marked today (RF-7.2)', () => {
    expect(wasNotMarkedToday('Correr 5 km')).toBe('«Correr 5 km» no estaba marcado hoy.');
  });

  it('confirms the rename and the rename with no effect (RF-5.1, RF-5.5)', () => {
    expect(habitRenamed(1, 'Correr 10 km')).toBe('Hábito 1 renombrado a «Correr 10 km».');
    expect(renameUnchanged(1)).toBe('El hábito 1 ya se llamaba así. No hay cambios.');
  });

  it('asks before removing and reports both outcomes (RF-6.1, RF-6.2, RF-6.5)', () => {
    expect(confirmRemoval('Correr 5 km')).toBe(
      '¿Eliminar «Correr 5 km» y todo su historial? [s/N] ',
    );
    expect(habitRemoved(1)).toBe('Hábito 1 eliminado.');
    expect(removalCancelled()).toBe('Operación cancelada. No se ha borrado nada.');
  });

  it('explains that removing without a terminal needs --yes (RF-6.4)', () => {
    expect(removalNeedsConfirmation()).toContain('--yes');
  });

  it('says a day in singular and the rest in plural', () => {
    expect(markedDone('X', 1)).toContain('Racha: 1 día.');
    expect(markedDone('X', 0)).toContain('Racha: 0 días.');
    expect(markedDone('X', 2)).toContain('Racha: 2 días.');
  });
});

describe('the list table (RF-4.1, RF-4.2, RF-4.3, RF-4.4)', () => {
  const habits: HabitView[] = [
    view(1, 'Leer 20 páginas', 3, true),
    view(2, 'Correr 5 km', 1, false),
    view(3, 'Meditar', 0, false),
  ];

  it('explains how to create the first habit when there is none (RF-4.3)', () => {
    expect(noHabitsYet()).toContain('eutask add');
  });

  it('shows the id, the state, the streak and the name of each habit (RF-4.1)', () => {
    const lines = withoutAnsi(habitsTable(habits)).split('\n');

    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('ID   ESTADO         RACHA     HÁBITO');
    expect(lines[1]).toBe('1    [x] hecho      3 días    Leer 20 páginas');
    expect(lines[2]).toBe('2    [ ] pendiente  1 día     Correr 5 km');
    expect(lines[3]).toBe('3    [ ] pendiente  0 días    Meditar');
  });

  it('keeps the order it is given, which the core already sorted (RF-4.2)', () => {
    const lines = withoutAnsi(habitsTable([view(9, 'Última', 0, false), view(2, 'Primera', 7, true)]))
      .split('\n')
      .slice(1);

    expect(lines[0]).toContain('Última');
    expect(lines[1]).toContain('Primera');
  });

  it('keeps the textual state whole, so it survives a redirection (RF-4.4)', () => {
    // The colour of chalk may wrap the cell, but never break the marker apart.
    const table = habitsTable(habits);

    expect(table).toContain('[x] hecho');
    expect(table).toContain('[ ] pendiente');
    expect(withoutAnsi(table)).toContain('[x] hecho');
    expect(withoutAnsi(table)).toContain('[ ] pendiente');
  });

  it('lines the columns up whatever the width of the values', () => {
    const wide = [
      view(1234, 'Un nombre bastante largo para la última columna', 1000, true),
      view(7, 'Corto', 0, false),
    ];

    const lines = withoutAnsi(habitsTable(wide)).split('\n');
    const nameColumn = (line: string): number => line.indexOf('HÁBITO');

    expect(lines[0]).toBeDefined();
    const start = nameColumn(lines[0] ?? '');
    expect(lines[1]?.slice(start)).toBe('Un nombre bastante largo para la última columna');
    expect(lines[2]?.slice(start)).toBe('Corto');
  });

  it('prints only the header when the list is empty', () => {
    expect(withoutAnsi(habitsTable([]))).toBe('ID   ESTADO         RACHA     HÁBITO');
  });
});
