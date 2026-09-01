import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { addCommand } from '../src/commands/add.js';
import { listCommand } from '../src/commands/list.js';
import type { CommandContext } from '../src/commands/context.js';
import type { Database } from '../src/core.js';

// T13 — the add and list commands. The rules are already pinned down in core.test.ts and the
// wording in output.test.ts, so what is tested here is only what neither of them can see: that
// the file was written, that a failed run wrote nothing, and that `today` reaches the core.
// RF-1, RF-4, RF-8.2.

const TODAY = '2026-09-01';

let home: string;
let out: string[];
let err: string[];

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'eutask-test-'));
  out = [];
  err = [];
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

const dataPath = (): string => join(home, 'data.json');

const context = (): CommandContext => ({
  dataPath: dataPath(),
  today: TODAY,
  stdout: (text) => out.push(text),
  stderr: (text) => err.push(text),
});

const stored = (): Database => JSON.parse(readFileSync(dataPath(), 'utf8')) as Database;

const write = (contents: string): void => writeFileSync(dataPath(), contents, 'utf8');

/** What a terminal shows once the colour codes are gone, as when the output is redirected. */
const withoutAnsi = (text: string): string => text.replace(/\[[0-9;]*m/g, '');

describe('add (RF-1)', () => {
  it('creates the habit with the day of the context and says its id (RF-1.1, RF-8.4)', () => {
    // No file yet: an empty database is the starting point, not an error.
    expect(existsSync(dataPath())).toBe(false);

    expect(addCommand('Leer 20 páginas', context())).toBe(true);

    expect(out.join('')).toContain('«Leer 20 páginas» (id 1)');
    expect(err).toEqual([]);
    expect(stored()).toEqual({
      version: 1,
      nextId: 2,
      habits: [{ id: 1, name: 'Leer 20 páginas', createdAt: TODAY, marks: [] }],
    });
  });

  it('picks up what the previous run left on disk (RF-8.2, RF-1.7)', () => {
    addCommand('Leer 20 páginas', context());
    addCommand('Correr 5 km', context());

    expect(stored().nextId).toBe(3);
    expect(stored().habits.map((habit) => habit.id)).toEqual([1, 2]);
  });

  it('rejects an invalid name without creating the file (RF-1.3)', () => {
    expect(addCommand('   ', context())).toBe(false);

    expect(existsSync(dataPath())).toBe(false);
    expect(out).toEqual([]);
    expect(err.join('')).not.toBe('');
  });

  it('rejects a duplicate leaving the stored data byte for byte (RF-1.6)', () => {
    addCommand('Meditar', context());
    const before = readFileSync(dataPath());

    expect(addCommand('  Meditar ', context())).toBe(false);
    expect(readFileSync(dataPath())).toEqual(before);
  });

  it('reports damaged data and writes nothing (RF-8.5)', () => {
    write('{ no es json');
    const before = readFileSync(dataPath());

    expect(addCommand('Meditar', context())).toBe(false);
    expect(readFileSync(dataPath())).toEqual(before);
    expect(err.join('')).toContain(dataPath());
  });
});

describe('list (RF-4)', () => {
  it('succeeds with a hint and creates nothing when there are no habits (RF-4.3)', () => {
    expect(listCommand(context())).toBe(true);

    expect(out.join('')).toContain('No tienes hábitos todavía');
    expect(err).toEqual([]);
    expect(existsSync(dataPath())).toBe(false);
  });

  it('shows every stored habit with the streak of the given day (RF-4.1)', () => {
    write(
      JSON.stringify({
        version: 1,
        nextId: 4,
        habits: [
          {
            id: 1,
            name: 'Leer 20 páginas',
            createdAt: '2026-08-25',
            marks: ['2026-08-30', '2026-08-31', '2026-09-01'],
          },
          { id: 2, name: 'Correr 5 km', createdAt: '2026-08-28', marks: ['2026-08-31'] },
          { id: 3, name: 'Meditar', createdAt: '2026-09-01', marks: [] },
        ],
      }),
    );

    expect(listCommand(context())).toBe(true);

    const lines = withoutAnsi(out.join('')).trimEnd().split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toMatch(/^1\s+\[x\] hecho\s+3 días\s+Leer 20 páginas$/);
    expect(lines[2]).toMatch(/^2\s+\[ \] pendiente\s+1 día\s+Correr 5 km$/);
    expect(lines[3]).toMatch(/^3\s+\[ \] pendiente\s+0 días\s+Meditar$/);
  });

  it('reports damaged data instead of showing a table (RF-8.5)', () => {
    write('{ no es json');

    expect(listCommand(context())).toBe(false);
    expect(out).toEqual([]);
    expect(err.join('')).toContain(dataPath());
  });
});
