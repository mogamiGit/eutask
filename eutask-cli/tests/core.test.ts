import { format, parseISO, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  computeStreak,
  emptyDatabase,
  normalizeName,
  parseHabitId,
  validateName,
  type Database,
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
