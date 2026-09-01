// `eutask rename <id> <nombre>` — RF-5. No domain here: it loads, calls the core, saves and prints.

import { renameHabit } from '../core.js';
import { errorText, habitRenamed, renameUnchanged } from '../output.js';
import { saveDatabase } from '../storage.js';
import {
  FAILED,
  SUCCEEDED,
  loadOrReport,
  parseIdOrReport,
  type CommandContext,
  type CommandResult,
} from './context.js';

/**
 * RF-5.1 and RF-5.3: only the name changes, so the id and the marks —and with them the streak—
 * stay put. RF-5.5: renaming to the name it already had changes nothing, which is a normal
 * outcome and writes nothing. The new name goes through the rules of RF-1.2..1.5 (RF-5.2) and
 * cannot be the one of another habit (RF-5.4); in both cases nothing is written.
 */
export const renameCommand = (
  rawId: string,
  rawName: string,
  context: CommandContext,
): CommandResult => {
  const id = parseIdOrReport(rawId, context);
  if (id === undefined) return FAILED;

  const db = loadOrReport(context);
  if (db === undefined) return FAILED;

  const result = renameHabit(db, id, rawName);
  if (!result.ok) {
    context.stderr(`${errorText(result.code)}\n`);
    return FAILED;
  }

  const { habit, unchanged } = result.value;

  // The core gives the very same database back on a no-op, so there is nothing to save (RF-8.2).
  if (!unchanged) saveDatabase(context.dataPath, result.value.db);

  context.stdout(`${unchanged ? renameUnchanged(habit.id) : habitRenamed(habit.id, habit.name)}\n`);

  return SUCCEEDED;
};
