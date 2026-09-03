import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { buildProgram, todayIsoDate } from '../src/cli.js';

// T12 — the wiring of commander: which commands exist, what they take, and where today comes
// from. What each one does is T13 to T15. RF-1.1, RF-3.1.

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as { version: string };

describe('todayIsoDate (RF-3.1)', () => {
  it('formats the given moment as YYYY-MM-DD', () => {
    expect(todayIsoDate(new Date(2026, 8, 1, 12, 0))).toBe('2026-09-01');
  });

  it('uses the local day, not the UTC one', () => {
    // Both ends of the day: whatever the timezone, going through UTC would move one of them.
    expect(todayIsoDate(new Date(2026, 8, 1, 23, 59))).toBe('2026-09-01');
    expect(todayIsoDate(new Date(2026, 8, 1, 0, 1))).toBe('2026-09-01');
  });

  it('pads the month and the day', () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05');
  });

  it('reads the clock when it is given nothing', () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('the program (RF-1.1)', () => {
  const program = buildProgram();

  it('is called eutask and carries the version of the package', () => {
    expect(program.name()).toBe('eutask');
    expect(program.version()).toBe(packageJson.version);
  });

  it('registers the six commands of the spec', () => {
    expect(program.commands.map((command) => command.name()).sort()).toEqual([
      'add',
      'done',
      'list',
      'remove',
      'rename',
      'undone',
    ]);
  });

  it('describes every command in Spanish, so --help is useful', () => {
    for (const command of program.commands) {
      expect(command.description().length).toBeGreaterThan(0);
    }
  });

  const argumentsOf = (name: string): string[] =>
    program.commands
      .find((command) => command.name() === name)
      ?.registeredArguments.map((argument) => argument.name()) ?? [];

  it('takes the name of the habit as a single argument (RF-1.1)', () => {
    expect(argumentsOf('add')).toEqual(['nombre']);
    expect(argumentsOf('list')).toEqual([]);
  });

  it('takes the identifier in the four commands that need one (RF-1.8)', () => {
    expect(argumentsOf('done')).toEqual(['id']);
    expect(argumentsOf('undone')).toEqual(['id']);
    expect(argumentsOf('remove')).toEqual(['id']);
    expect(argumentsOf('rename')).toEqual(['id', 'nombre']);
  });

  it('offers --yes only on remove (RF-6.3)', () => {
    const optionsOf = (name: string): string[] =>
      program.commands
        .find((command) => command.name() === name)
        ?.options.map((option) => option.long ?? '') ?? [];

    expect(optionsOf('remove')).toContain('--yes');
    expect(optionsOf('done')).not.toContain('--yes');
  });

  it('shows the six commands in the help text', () => {
    const help = program.helpInformation();

    for (const name of ['add', 'list', 'done', 'undone', 'rename', 'remove']) {
      expect(help).toContain(name);
    }
  });
});
