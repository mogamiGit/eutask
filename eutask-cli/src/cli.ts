#!/usr/bin/env node
// The command line layer: it parses the arguments, reads the clock and sets the exit code.
// The domain lives in core.ts and the disk in storage.ts; here there is only wiring.

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { format } from 'date-fns';

import { addCommand } from './commands/add.js';
import type { CommandContext, CommandResult } from './commands/context.js';
import { doneCommand } from './commands/done.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { renameCommand } from './commands/rename.js';
import { undoneCommand } from './commands/undone.js';
import { askConfirmation, isInteractive } from './confirm.js';
import type { IsoDate } from './core.js';
import { resolveDataPath } from './storage.js';

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

/**
 * The outside world a command works against: the file, the local day, the two streams and the
 * question. This is the only place where the process itself is read.
 */
const commandContext = (): CommandContext => ({
  dataPath: resolveDataPath(),
  today: todayIsoDate(),
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  interactive: isInteractive(),
  confirm: (question) => askConfirmation(question),
});

/** The commands say whether they ended as expected; the exit code is decided only here. */
const finish = (result: CommandResult): void => {
  process.exitCode = result ? EXIT_SUCCESS : EXIT_FAILURE;
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
    .action((nombre: string) => {
      finish(addCommand(nombre, commandContext()));
    });

  program
    .command('list')
    .description('Muestra tus hábitos con su racha y si ya están hechos hoy.')
    .action(() => {
      finish(listCommand(commandContext()));
    });

  program
    .command('done')
    .description('Marca que hoy has cumplido un hábito.')
    .argument('<id>', 'Identificador del hábito.')
    .action((id: string) => {
      finish(doneCommand(id, commandContext()));
    });

  program
    .command('undone')
    .description('Retira la marca de hoy de un hábito.')
    .argument('<id>', 'Identificador del hábito.')
    .action((id: string) => {
      finish(undoneCommand(id, commandContext()));
    });

  program
    .command('rename')
    .description('Cambia el nombre de un hábito sin perder su historial.')
    .argument('<id>', 'Identificador del hábito.')
    .argument('<nombre>', 'Nombre nuevo.')
    .action((id: string, nombre: string) => {
      finish(renameCommand(id, nombre, commandContext()));
    });

  program
    .command('remove')
    .description('Elimina un hábito y todo su historial.')
    .argument('<id>', 'Identificador del hábito.')
    .option('--yes', 'Elimina sin preguntar, para poder usarlo desde un script.')
    .action(async (id: string, options: { yes?: boolean }) => {
      finish(await removeCommand(id, { yes: options.yes === true }, commandContext()));
    });

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
