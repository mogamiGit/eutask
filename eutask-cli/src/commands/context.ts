// What every command needs from the outside world. The clock, the path and the two streams are
// parameters, so a command can be exercised without spawning a process (plan, "Módulos").

import type { Database, IsoDate } from '../core.js';
import { loadDatabase } from '../storage.js';
import { loadErrorText } from '../output.js';

export type CommandContext = {
  /** Where the single JSON lives, already resolved by cli.ts (RF-8.1). */
  dataPath: string;
  /** The local day, read once in cli.ts and never inside the core (RF-3.1). */
  today: IsoDate;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
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
