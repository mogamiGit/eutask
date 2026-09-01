// `eutask undone <id>` — RF-7. No domain here: it loads, calls the core, saves and prints.

import { markUndone } from '../core.js';
import { errorText, markWithdrawn, wasNotMarkedToday } from '../output.js';
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
 * RF-7.1: withdraws the mark of today, and only that one, so the previous days —and the streak
 * they hold— stay put. RF-7.2: withdrawing what was never marked changes nothing, which is a
 * normal outcome and writes nothing. A missing habit ends at RF-1.8, with the data untouched.
 */
export const undoneCommand = (rawId: string, context: CommandContext): CommandResult => {
  const id = parseIdOrReport(rawId, context);
  if (id === undefined) return FAILED;

  const db = loadOrReport(context);
  if (db === undefined) return FAILED;

  const result = markUndone(db, id, context.today);
  if (!result.ok) {
    context.stderr(`${errorText(result.code)}\n`);
    return FAILED;
  }

  const { habit, streak, wasNotMarked } = result.value;

  // The core gives the very same database back on a no-op, so there is nothing to save (RF-8.2).
  if (!wasNotMarked) saveDatabase(context.dataPath, result.value.db);

  context.stdout(
    `${wasNotMarked ? wasNotMarkedToday(habit.name) : markWithdrawn(habit.name, streak)}\n`,
  );

  return SUCCEEDED;
};
