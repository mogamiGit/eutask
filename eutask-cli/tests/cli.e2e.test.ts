import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildCli, run } from './helpers/run.js';

// T16 — the real binary, one process per run and a data directory of its own. One case per row
// of the table in plan.md, "Contrato de la CLI": every row checks the exit code and what came
// out on stdout or stderr. RF-1 to RF-8 and RNF-2.
//
// Two rows of that table cannot live here: asking before deleting and answering no need a
// terminal, and a spawned process has none. They are covered in commands.test.ts, where the
// confirmation goes in as a parameter. What this file does check is the other side of the same
// rule, RF-6.4: with no terminal and no --yes, nothing is deleted.

let home: string;

beforeAll(() => {
  buildCli();
}, 120_000);

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'eutask-e2e-'));
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

const dataPath = (): string => join(home, 'data.json');

const eutask = (...args: string[]): ReturnType<typeof run> => run(args, home);

describe('add (RF-1)', () => {
  it('creates the habit and answers with its id (RF-1.1)', async () => {
    const { stdout, stderr, code } = await eutask('add', 'Leer 20 páginas');

    expect(code).toBe(0);
    expect(stdout).toContain('Hábito creado: «Leer 20 páginas» (id 1).');
    expect(stderr).toBe('');
  });

  it.each([
    ['empty', '   '],
    ['longer than 60 characters', 'a'.repeat(61)],
    ['with a line break', 'Leer\n20 páginas'],
  ])('rejects a name %s saying how to fix it (RF-1.3, RF-1.4, RF-1.5, RNF-2)', async (_c, name) => {
    const { stdout, stderr, code } = await eutask('add', name);

    expect(code).toBe(1);
    expect(stdout).toBe('');
    expect(stderr).not.toBe('');
  });

  it('rejects a duplicate name (RF-1.6)', async () => {
    await eutask('add', 'Meditar');

    const { stderr, code } = await eutask('add', '  Meditar  ');

    expect(code).toBe(1);
    expect(stderr).toContain('Ya existe otro hábito con ese nombre.');
  });
});

describe('done and undone (RF-2, RF-7)', () => {
  beforeEach(async () => {
    await eutask('add', 'Leer 20 páginas');
  });

  it('marks today and answers with the streak (RF-2.1)', async () => {
    const { stdout, code } = await eutask('done', '1');

    expect(code).toBe(0);
    expect(stdout).toContain('Hecho: «Leer 20 páginas». Racha: 1 día.');
  });

  it('accepts marking twice on the same day (RF-2.2)', async () => {
    await eutask('done', '1');

    const { stdout, code } = await eutask('done', '1');

    expect(code).toBe(0);
    expect(stdout).toContain('«Leer 20 páginas» ya estaba marcado hoy. Racha: 1 día.');
  });

  it('withdraws the mark of today (RF-7.1)', async () => {
    await eutask('done', '1');

    const { stdout, code } = await eutask('undone', '1');

    expect(code).toBe(0);
    expect(stdout).toContain('Marca de hoy retirada en «Leer 20 páginas». Racha: 0 días.');
  });

  it('accepts withdrawing what was not marked (RF-7.2)', async () => {
    const { stdout, code } = await eutask('undone', '1');

    expect(code).toBe(0);
    expect(stdout).toContain('«Leer 20 páginas» no estaba marcado hoy.');
  });
});

describe('list (RF-4)', () => {
  it('says how to start when there are no habits yet (RF-4.3)', async () => {
    const { stdout, code } = await eutask('list');

    expect(code).toBe(0);
    expect(stdout).toContain('No tienes hábitos todavía. Crea el primero con: eutask add');
  });

  it('shows the habits with their streak and their state (RF-4.1, RF-4.2)', async () => {
    await eutask('add', 'Leer 20 páginas');
    await eutask('add', 'Meditar');
    await eutask('done', '2');

    const { stdout, code } = await eutask('list');

    expect(code).toBe(0);
    // The one with the longest streak goes first, whatever the order they were created in.
    const lines = stdout.trimEnd().split('\n');
    expect(lines[1]).toMatch(/^2\s+\[x\] hecho\s+1 día\s+Meditar$/);
    expect(lines[2]).toMatch(/^1\s+\[ \] pendiente\s+0 días\s+Leer 20 páginas$/);
  });

  it('keeps the state readable when the output is captured (RF-4.4)', async () => {
    await eutask('add', 'Meditar');

    const { stdout } = await eutask('list');

    // Redirected output is not a terminal, so no colour code may reach it.
    expect(stdout).not.toMatch(/\[/);
    expect(stdout).toContain('[ ] pendiente');
  });
});

describe('rename (RF-5)', () => {
  beforeEach(async () => {
    await eutask('add', 'Leer 20 páginas');
    await eutask('add', 'Meditar');
  });

  it('changes the name keeping the history (RF-5.1, RF-5.3)', async () => {
    await eutask('done', '1');

    const { stdout, code } = await eutask('rename', '1', 'Leer 30 páginas');
    expect(code).toBe(0);
    expect(stdout).toContain('Hábito 1 renombrado a «Leer 30 páginas».');

    const { stdout: listed } = await eutask('list');
    expect(listed).toMatch(/1\s+\[x\] hecho\s+1 día\s+Leer 30 páginas/);
  });

  it('accepts renaming to the name it already had (RF-5.5)', async () => {
    const { stdout, code } = await eutask('rename', '1', 'Leer 20 páginas');

    expect(code).toBe(0);
    expect(stdout).toContain('El hábito 1 ya se llamaba así. No hay cambios.');
  });

  it('refuses the name of another habit (RF-5.4)', async () => {
    const { stderr, code } = await eutask('rename', '1', 'Meditar');

    expect(code).toBe(1);
    expect(stderr).toContain('Ya existe otro hábito con ese nombre.');
  });

  it('refuses an invalid name (RF-5.2)', async () => {
    const { stderr, code } = await eutask('rename', '1', '   ');

    expect(code).toBe(1);
    expect(stderr).toContain('El nombre no puede estar vacío.');
  });
});

describe('remove (RF-6)', () => {
  beforeEach(async () => {
    await eutask('add', 'Leer 20 páginas');
  });

  it('deletes with --yes (RF-6.1, RF-6.3)', async () => {
    const { stdout, code } = await eutask('remove', '1', '--yes');

    expect(code).toBe(0);
    expect(stdout).toContain('Hábito 1 eliminado.');

    const { stdout: listed } = await eutask('list');
    expect(listed).toContain('No tienes hábitos todavía');
  });

  it('refuses to delete with no terminal and no --yes, and keeps the habit (RF-6.4)', async () => {
    const { stderr, code } = await eutask('remove', '1');

    expect(code).toBe(1);
    expect(stderr).toContain('Eliminar requiere confirmación. Vuelve a ejecutarlo con --yes.');

    const { stdout: listed } = await eutask('list');
    expect(listed).toContain('Leer 20 páginas');
  });

  it('never hands out the id of what was deleted (RF-1.7)', async () => {
    await eutask('remove', '1', '--yes');

    const { stdout } = await eutask('add', 'Meditar');
    expect(stdout).toContain('(id 2)');
  });
});

describe('the identifier of the four commands that take one (RF-1.8)', () => {
  beforeEach(async () => {
    await eutask('add', 'Leer 20 páginas');
  });

  /** Each command with exactly the arguments it takes, the identifier left to be filled in. */
  const withId = (id: string): string[][] => [
    ['done', id],
    ['undone', id],
    ['rename', id, 'Meditar'],
    ['remove', id, '--yes'],
  ];

  it.each(withId('007'))('%s fails on a malformed id pointing at list', async (...args) => {
    const { stderr, code } = await eutask(...args);

    expect(code).toBe(1);
    expect(stderr).toContain('Consulta tus hábitos con: eutask list');
  });

  it.each(withId('9'))('%s fails on an id that is not stored', async (...args) => {
    const { stderr, code } = await eutask(...args);

    expect(code).toBe(1);
    expect(stderr).toContain('No existe ningún hábito con ese identificador.');
  });
});

describe('the stored file (RF-8)', () => {
  it('carries what one run wrote into the next one (RF-8.2)', async () => {
    await eutask('add', 'Leer 20 páginas');
    await eutask('done', '1');

    const { stdout } = await eutask('list');

    expect(stdout).toMatch(/1\s+\[x\] hecho\s+1 día\s+Leer 20 páginas/);
  });

  it('starts from an empty set when there is no file yet (RF-8.4)', async () => {
    const { stdout, code } = await eutask('list');

    expect(code).toBe(0);
    expect(stdout).toContain('No tienes hábitos todavía');
  });

  it.each([
    ['done', '1'],
    ['undone', '1'],
    ['list'],
    ['add', 'Meditar'],
    ['rename', '1', 'Meditar'],
    ['remove', '1', '--yes'],
  ])('stops on damaged data and leaves the file as it was: %s (RF-8.5)', async (...args) => {
    writeFileSync(dataPath(), '{ no es json', 'utf8');
    const before = readFileSync(dataPath());

    const { stderr, code } = await eutask(...args);

    expect(code).toBe(1);
    expect(stderr).toContain(dataPath());
    expect(stderr).toContain('No se ha modificado.');
    expect(readFileSync(dataPath())).toEqual(before);
  });

  it('stops on valid JSON that is not the format eutask expects (RF-8.5)', async () => {
    // Damaged is not only unparseable: a file of another version, or with a habit without its
    // marks, is read without complaint by JSON.parse and would be destroyed by the next save.
    writeFileSync(dataPath(), JSON.stringify({ version: 2, nextId: 1, habits: [] }), 'utf8');
    const before = readFileSync(dataPath());

    const { stderr, code } = await eutask('list');

    expect(code).toBe(1);
    expect(stderr).toContain('no tiene el formato que espera eutask');
    expect(readFileSync(dataPath())).toEqual(before);
  });
});

describe('the program itself', () => {
  it('answers --help with the six commands and succeeds', async () => {
    const { stdout, code } = await eutask('--help');

    expect(code).toBe(0);
    for (const command of ['add', 'list', 'done', 'undone', 'rename', 'remove']) {
      expect(stdout).toContain(command);
    }
  });

  it('answers --version and succeeds', async () => {
    const { stdout, code } = await eutask('--version');

    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('fails on a command it does not know', async () => {
    const { code } = await eutask('inventado');

    expect(code).toBe(1);
  });

  it.each([
    ['add', 'Meditar', 'sobra'],
    ['list', 'sobra'],
    ['done', '1', 'sobra'],
    ['undone', '1', 'sobra'],
    ['rename', '1', 'Meditar', 'sobra'],
    ['remove', '1', '--yes', 'sobra'],
  ])('fails on an argument too many instead of ignoring it: %s', async (...args) => {
    // A typo must not pass for a valid command: an unexpected argument is a wrong argument
    // (plan.md, "Contrato de la CLI"), and silently dropping it hides the mistake.
    // The habit has to exist, otherwise the 1 would come from the id and not from the argument.
    await eutask('add', 'Leer 20 páginas');

    const { code, stderr } = await eutask(...args);

    expect(code).toBe(1);
    expect(stderr).not.toBe('');
  });

  it('runs the whole demo of the spec without errors', async () => {
    // add → done → list → rename → undone → remove, the closing criterion of the spec.
    const steps = [
      ['add', 'Leer 20 páginas'],
      ['done', '1'],
      ['list'],
      ['rename', '1', 'Leer 30 páginas'],
      ['undone', '1'],
      ['remove', '1', '--yes'],
    ];

    for (const step of steps) {
      const { stderr, code } = await eutask(...step);
      expect({ step, code, stderr }).toMatchObject({ code: 0, stderr: '' });
    }
  });
});
