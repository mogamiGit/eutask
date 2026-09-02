// What every command needs from the outside world. The clock, the path and the two streams are
// parameters, so a command can be exercised without spawning a process (plan, "Módulos").

import { parseHabitId, type Database, type IsoDate } from '../core.js';
import { loadDatabase } from '../storage.js';
import { errorText, loadErrorText } from '../output.js';

export type CommandContext = {
  /** Where the single JSON lives, already resolved by cli.ts (RF-8.1). */
  dataPath: string;
  /** The local day, read once in cli.ts and never inside the core (RF-3.1). */
  today: IsoDate;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** RF-6.4: whether there is somebody at the other end who can answer a question. */
  interactive: boolean;
  /** RF-6.2: asks before something irreversible. Only called when `interactive`. */
  confirm: (question: string) => Promise<boolean>;
};

/**
 * A command returns whether it ended as expected; cli.ts turns that into the exit code, so the
 * codes stay in one place and the commands know nothing about `process`.
 */
export type CommandResult = boolean;

export const SUCCEEDED = true;
export const FAILED = false;

/**
 * The reading every command starts with. A missing file is an empty database, not an error
 * (RF-8.4); damaged data print where the file is and that nothing was written (RF-8.5).
 */
export const loadOrReport = (context: CommandContext): Database | undefined => {
  const loaded = loadDatabase(context.dataPath);

  if (!loaded.ok) {
    context.stderr(`${loadErrorText(loaded.code, loaded.path)}\n`);
    return undefined;
  }

  return loaded.db;
};

/**
 * RF-1.8: the identifier the four commands that take one share. It is checked before reading
 * anything, so a malformed id never even opens the file. The message already points at
 * `eutask list`, which is where the identifiers in force can be seen.
 */
export const parseIdOrReport = (raw: string, context: CommandContext): number | undefined => {
  const parsed = parseHabitId(raw);

  if (!parsed.ok) {
    context.stderr(`${errorText(parsed.code)}\n`);
    return undefined;
  }

  return parsed.value;
};
