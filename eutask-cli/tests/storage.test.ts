import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { emptyDatabase, type Database } from '../src/core.js';
import { loadDatabase, resolveDataPath } from '../src/storage.js';

// T8 — the disk is real here: a temporary directory pointed at by EUTASK_HOME, no mocks.
// RF-8.1, RF-8.4, RF-8.5.

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'eutask-test-'));
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

const dataPath = (): string => join(home, 'data.json');

const write = (contents: string): void => writeFileSync(dataPath(), contents, 'utf8');

const bytes = (): Buffer => readFileSync(dataPath());

const validDatabase: Database = {
  version: 1,
  nextId: 3,
  habits: [
    { id: 1, name: 'Leer 20 páginas', createdAt: '2026-08-25', marks: ['2026-08-31'] },
    { id: 2, name: 'Meditar', createdAt: '2026-09-01', marks: [] },
  ],
};

describe('resolveDataPath (RF-8.1)', () => {
  it('points inside $EUTASK_HOME when the variable is set', () => {
    expect(resolveDataPath({ EUTASK_HOME: '/srv/habits' })).toBe('/srv/habits/data.json');
  });

  it('falls back to ~/.eutask when the variable is missing or empty', () => {
    const fallback = join(homedir(), '.eutask', 'data.json');

    expect(resolveDataPath({})).toBe(fallback);
    expect(resolveDataPath({ EUTASK_HOME: '' })).toBe(fallback);
  });

  it('reads the environment of the process by default', () => {
    expect(resolveDataPath()).toBe(resolveDataPath(process.env));
  });
});

describe('loadDatabase (RF-8.4, RF-8.5)', () => {
  it('starts empty when the file does not exist, without any error (RF-8.4)', () => {
    expect(loadDatabase(dataPath())).toEqual({ ok: true, db: emptyDatabase() });
  });

  it('starts empty when not even the directory exists (RF-8.4)', () => {
    const missing = join(home, 'nested', 'deeper', 'data.json');

    expect(loadDatabase(missing)).toEqual({ ok: true, db: emptyDatabase() });
  });

  it('reads back a valid file with all its habits and marks', () => {
    write(JSON.stringify(validDatabase, null, 2));

    expect(loadDatabase(dataPath())).toEqual({ ok: true, db: validDatabase });
  });

  it('rejects a file that is not valid JSON and leaves it untouched (RF-8.5)', () => {
    write('{ "version": 1, "nextId": ');
    const before = bytes();

    expect(loadDatabase(dataPath())).toEqual({
      ok: false,
      code: 'INVALID_JSON',
      path: dataPath(),
    });
    expect(bytes()).toEqual(before);
  });

  it('rejects an empty file (RF-8.5)', () => {
    write('');

    expect(loadDatabase(dataPath())).toMatchObject({ ok: false, code: 'INVALID_JSON' });
  });

  it.each([
    ['a top level array', '[]'],
    ['a top level string', '"nope"'],
    ['null', 'null'],
    ['an unknown version', JSON.stringify({ ...validDatabase, version: 2 })],
    ['a missing nextId', JSON.stringify({ version: 1, habits: [] })],
    ['a missing habits list', JSON.stringify({ version: 1, nextId: 1 })],
    ['habits that are not a list', JSON.stringify({ version: 1, nextId: 1, habits: {} })],
    [
      'an id that is not a positive integer',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 0, name: 'Meditar', createdAt: '2026-09-01', marks: [] }],
      }),
    ],
    [
      'a decimal id',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 1.5, name: 'Meditar', createdAt: '2026-09-01', marks: [] }],
      }),
    ],
    [
      'a name that is not a string',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 1, name: 7, createdAt: '2026-09-01', marks: [] }],
      }),
    ],
    [
      'a creation date in another format',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 1, name: 'Meditar', createdAt: '01/09/2026', marks: [] }],
      }),
    ],
    [
      'a mark that is not a date',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 1, name: 'Meditar', createdAt: '2026-09-01', marks: ['ayer'] }],
      }),
    ],
    [
      'a habit without marks',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 1, name: 'Meditar', createdAt: '2026-09-01' }],
      }),
    ],
    // Accepting these would mean dropping the unknown field on the next save.
    ['an unknown field of its own', JSON.stringify({ ...validDatabase, notes: 'hola' })],
    [
      'an unknown field inside a habit',
      JSON.stringify({
        version: 1,
        nextId: 2,
        habits: [{ id: 1, name: 'Meditar', createdAt: '2026-09-01', marks: [], colour: 'red' }],
      }),
    ],
  ])('rejects valid JSON that is off schema: %s (RF-8.5)', (_case, contents) => {
    write(contents);
    const before = bytes();

    expect(loadDatabase(dataPath())).toEqual({
      ok: false,
      code: 'INVALID_SCHEMA',
      path: dataPath(),
    });
    expect(bytes()).toEqual(before);
  });

  it('accepts a habit whose marks are an empty list', () => {
    write(JSON.stringify({ version: 1, nextId: 1, habits: [] }));

    expect(loadDatabase(dataPath())).toEqual({
      ok: true,
      db: { version: 1, nextId: 1, habits: [] },
    });
  });

  it('works with the path that resolveDataPath gives for $EUTASK_HOME', () => {
    const nested = join(home, 'config');
    mkdirSync(nested);
    const path = resolveDataPath({ EUTASK_HOME: nested });
    writeFileSync(path, JSON.stringify(validDatabase), 'utf8');

    expect(loadDatabase(path)).toEqual({ ok: true, db: validDatabase });
  });
});
