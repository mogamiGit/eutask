import { describe, expect, it } from 'vitest';

import {
  emptyDatabase,
  normalizeName,
  parseHabitId,
  validateName,
  type Database,
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
