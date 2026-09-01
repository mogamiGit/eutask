import { format, parseISO, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  addHabit,
  computeStreak,
  emptyDatabase,
  markDone,
  markUndone,
  normalizeName,
  parseHabitId,
  removeHabit,
  renameHabit,
  validateName,
  type Database,
  type Habit,
  type IsoDate,
} from '../src/core.js';

// T2 — domain types, empty database, name normalisation and validation, id parsing.
// RF-1.2..1.5, RF-1.8, RF-8.4. No clock and no disk here: everything is pure.

const COMBINING_ACUTE = '́';

describe('emptyDatabase (RF-8.4)', () => {
  it('starts with no habits, version 1 and the first id still unused', () => {
    expect(emptyDatabase()).toEqual({ version: 1, nextId: 1, habits: [] });
  });

  it('returns a fresh value each call, so callers cannot share state', () => {
    const first: Database = emptyDatabase();
    const second: Database = emptyDatabase();

    expect(first).not.toBe(second);
    expect(first.habits).not.toBe(second.habits);
  });
});

describe('normalizeName (RF-1.2, RF-1.6)', () => {
  it('trims the surrounding whitespace', () => {
    expect(normalizeName('   Leer 20 páginas \t ')).toBe('Leer 20 páginas');
  });

  it('normalises to NFC, so the decomposed spelling becomes the composed one', () => {
    const decomposed = `cafe${COMBINING_ACUTE}`;
    const composed = 'café';

    expect(decomposed).not.toBe(composed);
    expect(normalizeName(decomposed)).toBe(composed);
    expect(normalizeName(decomposed)).toBe(normalizeName(composed));
  });

  it('keeps the inner whitespace and the letter case untouched', () => {
    expect(normalizeName('  Correr  5 KM  ')).toBe('Correr  5 KM');
  });
});

describe('validateName (RF-1.3, RF-1.4, RF-1.5, RF-5.2)', () => {
  it('accepts a plain name and returns it normalised', () => {
    expect(validateName('  Leer 20 páginas  ')).toEqual({
      ok: true,
      value: 'Leer 20 páginas',
    });
  });

  it('rejects an empty name', () => {
    expect(validateName('')).toEqual({ ok: false, code: 'EMPTY_NAME' });
  });

  it('rejects a name made only of whitespace', () => {
    expect(validateName('   \t  ')).toEqual({ ok: false, code: 'EMPTY_NAME' });
  });

  it('accepts 59 and 60 characters but rejects 61, measured after the trim', () => {
    expect(validateName(`  ${'a'.repeat(59)}  `)).toEqual({ ok: true, value: 'a'.repeat(59) });
    expect(validateName(`  ${'a'.repeat(60)}  `)).toEqual({ ok: true, value: 'a'.repeat(60) });
    expect(validateName(`  ${'a'.repeat(61)}  `)).toEqual({ ok: false, code: 'NAME_TOO_LONG' });
  });

  it('measures the length in code points, so an emoji counts as one character', () => {
    expect(validateName('\u{1f642}'.repeat(60))).toEqual({
      ok: true,
      value: '\u{1f642}'.repeat(60),
    });
    expect(validateName('\u{1f642}'.repeat(61))).toEqual({ ok: false, code: 'NAME_TOO_LONG' });
  });

  it('measures the length after normalising to NFC', () => {
    // 60 decomposed letters are 120 code points, but only 60 once composed.
    const decomposed = `e${COMBINING_ACUTE}`.repeat(60);

    expect([...decomposed]).toHaveLength(120);
    expect(validateName(decomposed)).toEqual({ ok: true, value: 'é'.repeat(60) });
  });

  it('rejects line breaks and control characters', () => {
    expect(validateName('Leer\n20 páginas')).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
    expect(validateName('Leer\r\n20 páginas')).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
    expect(validateName('Leer\t20 páginas')).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
    expect(validateName('Leer\u0007páginas')).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
    expect(validateName('Leer\u007fpáginas')).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
  });

  it('checks emptiness before the single line rule, and that one before the length', () => {
    // A tab alone disappears with the trim, so it is an empty name, not a control character.
    expect(validateName('\t')).toEqual({ ok: false, code: 'EMPTY_NAME' });
    // 61 characters with a line break inside are reported as the line break first.
    expect(validateName(`${'a'.repeat(60)}\nb`)).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
  });

  it('keeps names that only differ in case or accents apart (RF-1.6)', () => {
    expect(validateName('Correr')).toEqual({ ok: true, value: 'Correr' });
    expect(validateName('correr')).toEqual({ ok: true, value: 'correr' });
    expect(validateName('Leer más')).toEqual({ ok: true, value: 'Leer más' });
    expect(validateName('Leer mas')).toEqual({ ok: true, value: 'Leer mas' });
  });
});

describe('parseHabitId (RF-1.8)', () => {
  it('accepts a positive decimal integer', () => {
    expect(parseHabitId('1')).toEqual({ ok: true, value: 1 });
    expect(parseHabitId('42')).toEqual({ ok: true, value: 42 });
    expect(parseHabitId('1000')).toEqual({ ok: true, value: 1000 });
  });

  it('rejects zero, negative numbers and decimals', () => {
    expect(parseHabitId('0')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('-1')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('1.5')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('+1')).toEqual({ ok: false, code: 'INVALID_ID' });
  });

  it('rejects leading zeros and exponential or hexadecimal notation', () => {
    expect(parseHabitId('007')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('1e3')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('0x1')).toEqual({ ok: false, code: 'INVALID_ID' });
  });

  it('rejects empty, padded and non numeric text', () => {
    expect(parseHabitId('')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('   ')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId(' 1 ')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('abc')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('1abc')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('١٢')).toEqual({ ok: false, code: 'INVALID_ID' });
    expect(parseHabitId('1\n')).toEqual({ ok: false, code: 'INVALID_ID' });
  });
});

describe('computeStreak (RF-3)', () => {
  // T3 — fixed "today", never the real clock (RF-3.1).
  const TODAY = '2026-09-01';
  const daysBefore = (days: number): IsoDate =>
    format(subDays(parseISO(TODAY), days), 'yyyy-MM-dd');

  it('is 0 for a habit without any mark (RF-3.5)', () => {
    expect(computeStreak([], TODAY)).toBe(0);
  });

  it('is 1 when the only mark is today (RF-3.2)', () => {
    expect(computeStreak([TODAY], TODAY)).toBe(1);
  });

  it('counts back from today, today included (RF-3.2)', () => {
    expect(computeStreak([daysBefore(2), daysBefore(1), TODAY], TODAY)).toBe(3);
  });

  it('stays alive all day long when the last mark is yesterday (RF-3.3)', () => {
    expect(computeStreak([daysBefore(2), daysBefore(1)], TODAY)).toBe(2);
  });

  it('is 0 when there is no mark for today nor yesterday (RF-3.4)', () => {
    expect(computeStreak([daysBefore(3), daysBefore(2)], TODAY)).toBe(0);
  });

  it('stops at the first missing day, so an older run does not count', () => {
    // The gap on daysBefore(2) cuts the count: only yesterday survives.
    expect(computeStreak([daysBefore(4), daysBefore(3), daysBefore(1)], TODAY)).toBe(1);
  });

  it('counts a long run across a month boundary', () => {
    const marks = Array.from({ length: 30 }, (_, index) => daysBefore(index));

    expect(marks).toContain('2026-08-03');
    expect(computeStreak(marks, TODAY)).toBe(30);
  });

  it('ignores marks in the future', () => {
    const tomorrow = format(subDays(parseISO(TODAY), -1), 'yyyy-MM-dd');

    expect(computeStreak([tomorrow], TODAY)).toBe(0);
    expect(computeStreak([TODAY, tomorrow], TODAY)).toBe(1);
    expect(computeStreak([daysBefore(3), tomorrow], TODAY)).toBe(0);
  });

  it('does not depend on the order of the marks nor on repeated days', () => {
    expect(computeStreak([TODAY, daysBefore(2), daysBefore(1)], TODAY)).toBe(3);
    expect(computeStreak([TODAY, TODAY, daysBefore(1)], TODAY)).toBe(2);
  });

  it('takes today as a parameter, so the same marks give different streaks', () => {
    const marks = [daysBefore(1), TODAY];

    expect(computeStreak(marks, TODAY)).toBe(2);
    expect(computeStreak(marks, daysBefore(1))).toBe(1);
    expect(computeStreak(marks, daysBefore(3))).toBe(0);
  });

  it('does not mutate the marks it receives', () => {
    const marks = [daysBefore(1), TODAY];

    computeStreak(marks, TODAY);

    expect(marks).toEqual([daysBefore(1), TODAY]);
  });
});

describe('addHabit (RF-1.1, RF-1.6, RF-1.7)', () => {
  // T4 — creation, duplicate rejection and never reused ids.
  const TODAY = '2026-09-01';

  const databaseWith = (habits: Habit[], nextId: number): Database => ({
    version: 1,
    nextId,
    habits,
  });

  const habit = (id: number, name: string, marks: IsoDate[] = []): Habit => ({
    id,
    name,
    createdAt: '2026-08-25',
    marks,
  });

  it('creates the habit with no marks, so its streak starts at 0 (RF-1.1)', () => {
    const result = addHabit(emptyDatabase(), 'Leer 20 páginas', TODAY);

    expect(result).toEqual({
      ok: true,
      value: {
        db: { version: 1, nextId: 2, habits: [expect.anything()] },
        habit: { id: 1, name: 'Leer 20 páginas', createdAt: TODAY, marks: [] },
      },
    });
    if (!result.ok) return;
    expect(computeStreak(result.value.habit.marks, TODAY)).toBe(0);
    expect(result.value.db.habits).toEqual([result.value.habit]);
  });

  it('takes the id from nextId and moves it forward (RF-1.7)', () => {
    const first = addHabit(emptyDatabase(), 'Correr 5 km', TODAY);
    expect(first).toMatchObject({ ok: true, value: { habit: { id: 1 } } });
    if (!first.ok) return;

    const second = addHabit(first.value.db, 'Meditar', TODAY);
    expect(second).toMatchObject({ ok: true, value: { habit: { id: 2 } } });
    if (!second.ok) return;

    expect(second.value.db.nextId).toBe(3);
    expect(second.value.db.habits.map((each) => each.id)).toEqual([1, 2]);
  });

  it('never reuses the id of a removed habit (RF-1.7)', () => {
    // Habit 3 is gone but nextId stayed at 4, as removing does not touch it.
    const db = databaseWith([habit(1, 'Correr 5 km'), habit(2, 'Meditar')], 4);

    expect(addHabit(db, 'Leer 20 páginas', TODAY)).toMatchObject({
      ok: true,
      value: { db: { nextId: 5 }, habit: { id: 4 } },
    });
  });

  it('stores the name trimmed and normalised, and today as the creation date (RF-1.2)', () => {
    expect(addHabit(emptyDatabase(), `  cafe${COMBINING_ACUTE}  `, TODAY)).toMatchObject({
      ok: true,
      value: { habit: { name: 'café', createdAt: TODAY } },
    });
  });

  it('rejects an exact duplicate without registering anything (RF-1.6)', () => {
    const db = databaseWith([habit(1, 'Correr 5 km')], 2);

    expect(addHabit(db, 'Correr 5 km', TODAY)).toEqual({ ok: false, code: 'DUPLICATE_NAME' });
    // The duplicate is judged after the trim and the NFC normalisation.
    expect(addHabit(db, '  Correr 5 km  ', TODAY)).toEqual({ ok: false, code: 'DUPLICATE_NAME' });
  });

  it('lets names that only differ in case or accents live together (RF-1.6)', () => {
    const db = databaseWith([habit(1, 'Correr'), habit(2, 'Leer más')], 3);

    expect(addHabit(db, 'correr', TODAY)).toMatchObject({
      ok: true,
      value: { habit: { id: 3, name: 'correr' } },
    });
    expect(addHabit(db, 'Leer mas', TODAY)).toMatchObject({
      ok: true,
      value: { habit: { id: 3, name: 'Leer mas' } },
    });
  });

  it('propagates the name rules of RF-1.3, RF-1.4 and RF-1.5', () => {
    const db = emptyDatabase();

    expect(addHabit(db, '   ', TODAY)).toEqual({ ok: false, code: 'EMPTY_NAME' });
    expect(addHabit(db, 'a'.repeat(61), TODAY)).toEqual({ ok: false, code: 'NAME_TOO_LONG' });
    expect(addHabit(db, 'Leer\n20', TODAY)).toEqual({
      ok: false,
      code: 'NAME_NOT_SINGLE_LINE',
    });
  });

  it('does not mutate the database it receives', () => {
    const habits = [habit(1, 'Correr 5 km')];
    const db = Object.freeze(databaseWith(habits, 2));

    const result = addHabit(db, 'Meditar', TODAY);

    expect(result).toMatchObject({ ok: true });
    expect(db.nextId).toBe(2);
    expect(db.habits).toBe(habits);
    expect(habits).toEqual([habit(1, 'Correr 5 km')]);
  });

  it('leaves the database untouched when it rejects the name', () => {
    const db = Object.freeze(databaseWith([habit(1, 'Correr 5 km')], 2));

    expect(addHabit(db, 'Correr 5 km', TODAY)).toEqual({ ok: false, code: 'DUPLICATE_NAME' });
    expect(db).toEqual(databaseWith([habit(1, 'Correr 5 km')], 2));
  });
});

describe('markDone and markUndone (RF-2, RF-7)', () => {
  // T5 — both are idempotent: repeating them leaves the data as they were.
  const TODAY = '2026-09-01';
  const YESTERDAY = '2026-08-31';
  const TWO_DAYS_AGO = '2026-08-30';

  const databaseWith = (habits: Habit[]): Database => ({ version: 1, nextId: 9, habits });

  const habit = (id: number, name: string, marks: IsoDate[]): Habit => ({
    id,
    name,
    createdAt: '2026-08-25',
    marks,
  });

  const marksOf = (db: Database, id: number): IsoDate[] | undefined =>
    db.habits.find((each) => each.id === id)?.marks;

  describe('markDone', () => {
    it('records today and reports the updated streak (RF-2.1)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [TWO_DAYS_AGO, YESTERDAY])]);

      const result = markDone(db, 1, TODAY);

      expect(result).toMatchObject({
        ok: true,
        value: {
          habit: { id: 1, name: 'Correr 5 km', marks: [TWO_DAYS_AGO, YESTERDAY, TODAY] },
          streak: 3,
          alreadyMarked: false,
        },
      });
      if (!result.ok) return;
      expect(marksOf(result.value.db, 1)).toEqual([TWO_DAYS_AGO, YESTERDAY, TODAY]);
    });

    it('turns the streak of a brand new habit from 0 into 1 (RF-3.2)', () => {
      const db = databaseWith([habit(1, 'Meditar', [])]);

      expect(markDone(db, 1, TODAY)).toMatchObject({
        ok: true,
        value: { habit: { marks: [TODAY] }, streak: 1, alreadyMarked: false },
      });
    });

    it('is a no-op when the habit was already marked today (RF-2.2)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [YESTERDAY, TODAY])]);

      const result = markDone(db, 1, TODAY);

      expect(result).toMatchObject({
        ok: true,
        value: { streak: 2, alreadyMarked: true },
      });
      if (!result.ok) return;
      // The very same database comes back, so the caller can skip the write.
      expect(result.value.db).toBe(db);
      expect(marksOf(result.value.db, 1)).toEqual([YESTERDAY, TODAY]);
    });

    it('keeps the marks ascending and without duplicates', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [TODAY, TWO_DAYS_AGO])]);

      const result = markDone(db, 1, TODAY);

      expect(result).toMatchObject({ ok: true, value: { alreadyMarked: true } });
      expect(markDone(databaseWith([habit(1, 'X', [TWO_DAYS_AGO])]), 1, TODAY)).toMatchObject({
        ok: true,
        value: { habit: { marks: [TWO_DAYS_AGO, TODAY] } },
      });
    });

    it('touches only the habit it is given', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', []), habit(2, 'Meditar', [YESTERDAY])]);

      const result = markDone(db, 1, TODAY);

      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(marksOf(result.value.db, 2)).toEqual([YESTERDAY]);
      expect(result.value.db.habits.map((each) => each.id)).toEqual([1, 2]);
    });

    it('fails on an id that matches no habit (RF-1.8)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [])]);

      expect(markDone(db, 7, TODAY)).toEqual({ ok: false, code: 'HABIT_NOT_FOUND' });
    });
  });

  describe('markUndone', () => {
    it('removes only the mark of today and reports the new streak (RF-7.1)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [TWO_DAYS_AGO, YESTERDAY, TODAY])]);

      const result = markUndone(db, 1, TODAY);

      expect(result).toMatchObject({
        ok: true,
        value: {
          habit: { marks: [TWO_DAYS_AGO, YESTERDAY] },
          streak: 2,
          wasNotMarked: false,
        },
      });
      if (!result.ok) return;
      // The older days survive, and the streak stays alive through yesterday (RF-3.3).
      expect(marksOf(result.value.db, 1)).toEqual([TWO_DAYS_AGO, YESTERDAY]);
    });

    it('leaves the habit with streak 0 when today was its only mark (RF-3.5)', () => {
      const db = databaseWith([habit(1, 'Meditar', [TODAY])]);

      expect(markUndone(db, 1, TODAY)).toMatchObject({
        ok: true,
        value: { habit: { id: 1, name: 'Meditar', marks: [] }, streak: 0, wasNotMarked: false },
      });
    });

    it('is a no-op when the habit was not marked today (RF-7.2)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [YESTERDAY])]);

      const result = markUndone(db, 1, TODAY);

      expect(result).toMatchObject({ ok: true, value: { streak: 1, wasNotMarked: true } });
      if (!result.ok) return;
      expect(result.value.db).toBe(db);
      expect(marksOf(result.value.db, 1)).toEqual([YESTERDAY]);
    });

    it('fails on an id that matches no habit (RF-1.8)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [TODAY])]);

      expect(markUndone(db, 7, TODAY)).toEqual({ ok: false, code: 'HABIT_NOT_FOUND' });
    });
  });

  it('leaves a single mark after done, undone and done on the same day (RF-2.1, RF-7.1)', () => {
    const start = databaseWith([habit(1, 'Correr 5 km', [YESTERDAY])]);

    const done = markDone(start, 1, TODAY);
    expect(done).toMatchObject({ ok: true });
    if (!done.ok) return;

    const undone = markUndone(done.value.db, 1, TODAY);
    expect(undone).toMatchObject({ ok: true, value: { streak: 1 } });
    if (!undone.ok) return;
    expect(marksOf(undone.value.db, 1)).toEqual([YESTERDAY]);

    const redone = markDone(undone.value.db, 1, TODAY);
    expect(redone).toMatchObject({ ok: true, value: { streak: 2, alreadyMarked: false } });
    if (!redone.ok) return;
    expect(marksOf(redone.value.db, 1)).toEqual([YESTERDAY, TODAY]);
  });

  it('does not mutate the database nor the marks it receives', () => {
    const marks = [YESTERDAY];
    const habits = [habit(1, 'Correr 5 km', marks)];
    const db = Object.freeze(databaseWith(habits));

    expect(markDone(db, 1, TODAY)).toMatchObject({ ok: true });
    expect(markUndone(db, 1, YESTERDAY)).toMatchObject({ ok: true });

    expect(db.habits).toBe(habits);
    expect(marks).toEqual([YESTERDAY]);
    expect(marksOf(db, 1)).toEqual([YESTERDAY]);
  });
});

describe('renameHabit and removeHabit (RF-5, RF-6.1)', () => {
  // T6 — renaming keeps the history; removing takes it away without freeing the id.
  const TODAY = '2026-09-01';
  const YESTERDAY = '2026-08-31';

  const databaseWith = (habits: Habit[], nextId = 9): Database => ({
    version: 1,
    nextId,
    habits,
  });

  const habit = (id: number, name: string, marks: IsoDate[] = []): Habit => ({
    id,
    name,
    createdAt: '2026-08-25',
    marks,
  });

  describe('renameHabit', () => {
    it('changes the name and nothing else (RF-5.1, RF-5.3)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [YESTERDAY, TODAY])]);

      const result = renameHabit(db, 1, 'Correr 10 km');

      expect(result).toEqual({
        ok: true,
        value: {
          db: expect.anything(),
          habit: {
            id: 1,
            name: 'Correr 10 km',
            createdAt: '2026-08-25',
            marks: [YESTERDAY, TODAY],
          },
          unchanged: false,
        },
      });
      if (!result.ok) return;
      // The id and the marks survive, so the streak does too (RF-5.3).
      expect(computeStreak(result.value.habit.marks, TODAY)).toBe(2);
      expect(result.value.db.habits).toEqual([result.value.habit]);
    });

    it('stores the new name trimmed and normalised (RF-5.2)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km')]);

      expect(renameHabit(db, 1, `  cafe${COMBINING_ACUTE}  `)).toMatchObject({
        ok: true,
        value: { habit: { name: 'café' }, unchanged: false },
      });
    });

    it('applies the name rules of RF-1.3, RF-1.4 and RF-1.5 (RF-5.2)', () => {
      const db = Object.freeze(databaseWith([habit(1, 'Correr 5 km')]));

      expect(renameHabit(db, 1, '   ')).toEqual({ ok: false, code: 'EMPTY_NAME' });
      expect(renameHabit(db, 1, 'a'.repeat(61))).toEqual({ ok: false, code: 'NAME_TOO_LONG' });
      expect(renameHabit(db, 1, 'Correr\n10')).toEqual({
        ok: false,
        code: 'NAME_NOT_SINGLE_LINE',
      });
      expect(db.habits).toEqual([habit(1, 'Correr 5 km')]);
    });

    it('rejects the name of another habit without touching the data (RF-5.4)', () => {
      const db = Object.freeze(databaseWith([habit(1, 'Correr 5 km'), habit(2, 'Meditar')]));

      expect(renameHabit(db, 1, 'Meditar')).toEqual({ ok: false, code: 'DUPLICATE_NAME' });
      // The clash is judged after the trim and the NFC normalisation, as in RF-1.6.
      expect(renameHabit(db, 1, '  Meditar  ')).toEqual({ ok: false, code: 'DUPLICATE_NAME' });
      expect(db.habits).toEqual([habit(1, 'Correr 5 km'), habit(2, 'Meditar')]);
    });

    it('accepts the very same name as a change with no effect (RF-5.5)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [TODAY]), habit(2, 'Meditar')]);

      const result = renameHabit(db, 1, 'Correr 5 km');

      expect(result).toMatchObject({
        ok: true,
        value: { habit: { id: 1, name: 'Correr 5 km', marks: [TODAY] }, unchanged: true },
      });
      if (!result.ok) return;
      // The very same database comes back, so the caller can skip the write.
      expect(result.value.db).toBe(db);
    });

    it('treats adding or removing surrounding spaces as no change (RF-5.5)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km')]);

      expect(renameHabit(db, 1, '   Correr 5 km   ')).toMatchObject({
        ok: true,
        value: { unchanged: true },
      });
    });

    it('tells apart a name that only differs in case or accents (RF-1.6)', () => {
      const db = databaseWith([habit(1, 'Correr'), habit(2, 'Leer más')]);

      expect(renameHabit(db, 1, 'correr')).toMatchObject({
        ok: true,
        value: { habit: { name: 'correr' }, unchanged: false },
      });
      expect(renameHabit(db, 1, 'Leer mas')).toMatchObject({
        ok: true,
        value: { habit: { name: 'Leer mas' }, unchanged: false },
      });
    });

    it('fails on an id that matches no habit (RF-1.8)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km')]);

      expect(renameHabit(db, 7, 'Meditar')).toEqual({ ok: false, code: 'HABIT_NOT_FOUND' });
    });

    it('leaves the other habits and the rest of the database untouched', () => {
      const habits = [habit(1, 'Correr 5 km'), habit(2, 'Meditar', [TODAY])];
      const db = Object.freeze(databaseWith(habits, 3));

      const result = renameHabit(db, 1, 'Correr 10 km');

      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(result.value.db).toMatchObject({ version: 1, nextId: 3 });
      expect(result.value.db.habits[1]).toEqual(habit(2, 'Meditar', [TODAY]));
      expect(db.habits).toBe(habits);
      expect(habits[0]).toEqual(habit(1, 'Correr 5 km'));
    });
  });

  describe('removeHabit', () => {
    it('deletes the habit with all its marks (RF-6.1)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [YESTERDAY, TODAY]), habit(2, 'Meditar')]);

      const result = removeHabit(db, 1);

      expect(result).toMatchObject({
        ok: true,
        value: { habit: { id: 1, name: 'Correr 5 km', marks: [YESTERDAY, TODAY] } },
      });
      if (!result.ok) return;
      expect(result.value.db.habits).toEqual([habit(2, 'Meditar')]);
    });

    it('does not free the id it just deleted (RF-1.7)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km'), habit(2, 'Meditar')], 3);

      const removed = removeHabit(db, 2);
      expect(removed).toMatchObject({ ok: true });
      if (!removed.ok) return;

      // nextId stays at 3, so the next habit is 3 and never 2 again.
      expect(removed.value.db.nextId).toBe(3);
      expect(addHabit(removed.value.db, 'Leer 20 páginas', TODAY)).toMatchObject({
        ok: true,
        value: { habit: { id: 3 } },
      });
    });

    it('empties the database when it removes the only habit', () => {
      const db = databaseWith([habit(1, 'Correr 5 km', [TODAY])], 2);

      expect(removeHabit(db, 1)).toMatchObject({
        ok: true,
        value: { db: { version: 1, nextId: 2, habits: [] } },
      });
    });

    it('fails on an id that matches no habit (RF-1.8)', () => {
      const db = databaseWith([habit(1, 'Correr 5 km')]);

      expect(removeHabit(db, 7)).toEqual({ ok: false, code: 'HABIT_NOT_FOUND' });
    });

    it('does not mutate the database it receives', () => {
      const habits = [habit(1, 'Correr 5 km'), habit(2, 'Meditar')];
      const db = Object.freeze(databaseWith(habits, 3));

      expect(removeHabit(db, 1)).toMatchObject({ ok: true });

      expect(db.habits).toBe(habits);
      expect(habits.map((each) => each.id)).toEqual([1, 2]);
    });
  });
});
