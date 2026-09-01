#!/usr/bin/env node
// The command line layer: it parses the arguments, reads the clock and sets the exit code.
// The domain lives in core.ts and the disk in storage.ts; here there is only wiring.

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { format } from 'date-fns';

import type { IsoDate } from './core.js';

/** 0 when the command ended as expected, no-ops included. */
export const EXIT_SUCCESS = 0;

/** 1 for invalid input, a missing habit, a clash or damaged data. The data stay untouched. */
export const EXIT_FAILURE = 1;

/**
 * RF-3.1: the clock is read here, once, and the local day travels into the core as a plain
 * parameter. Never `toISOString()`, which would answer with the UTC day.
 */
export const todayIsoDate = (now: Date = new Date()): IsoDate => format(now, 'yyyy-MM-dd');

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as { version: string };

// Scaffolding until T13 to T15 give each command its body.
const pending = (name: string) => (): void => {
  process.stderr.write(`El comando «${name}» todavía no está implementado.\n`);
  process.exitCode = EXIT_FAILURE;
};

/** The six commands of the spec, with their arguments and their help in Spanish. */
export const buildProgram = (): Command => {
  const program = new Command();

  program
    .name('eutask')
    .description('Registra hábitos diarios y calcula tus rachas de días consecutivos.')
    .version(packageJson.version, '-v, --version', 'Muestra la versión instalada.')
    .helpOption('-h, --help', 'Muestra esta ayuda.')
    .helpCommand('help [comando]', 'Muestra la ayuda de un comando.');

  program
    .command('add')
    .description('Crea un hábito nuevo.')
    .argument('<nombre>', 'Nombre del hábito, entre comillas si lleva espacios.')
    .action(pending('add'));

  program
    .command('list')
    .description('Muestra tus hábitos con su racha y si ya están hechos hoy.')
    .action(pending('list'));

  program
    .command('done')
    .description('Marca que hoy has cumplido un hábito.')
    .argument('<id>', 'Identificador del hábito.')
    .action(pending('done'));

  program
    .command('undone')
    .description('Retira la marca de hoy de un hábito.')
    .argument('<id>', 'Identificador del hábito.')
    .action(pending('undone'));

  program
    .command('rename')
    .description('Cambia el nombre de un hábito sin perder su historial.')
    .argument('<id>', 'Identificador del hábito.')
    .argument('<nombre>', 'Nombre nuevo.')
    .action(pending('rename'));

  program
    .command('remove')
    .description('Elimina un hábito y todo su historial.')
    .argument('<id>', 'Identificador del hábito.')
    .option('--yes', 'Elimina sin preguntar, para poder usarlo desde un script.')
    .action(pending('remove'));

  return program;
};

/**
 * `parseAsync` leaves the exit code alone on success; commander sets it itself on a wrong
 * command or argument. `--help` and `--version` end at 0.
 */
export const run = async (argv: string[] = process.argv): Promise<void> => {
  await buildProgram().parseAsync(argv);
};

/** True only when this file is the one node was asked to run, never when a test imports it. */
const isEntryPoint = (): boolean => {
  const invoked = process.argv[1];
  if (invoked === undefined) return false;

  try {
    // The bin is a symlink once installed, so both sides are resolved before comparing.
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(invoked);
  } catch {
    return false;
  }
};

if (isEntryPoint()) await run();
