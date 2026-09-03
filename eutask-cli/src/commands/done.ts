// `eutask done <id>` — RF-2. No domain here: it loads, calls the core, saves and prints.

import { markDone } from '../core.js';
import { alreadyDoneToday, errorText, markedDone } from '../output.js';
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
 * RF-2.1: marks today as fulfilled and answers with the streak in force. RF-2.2: marking twice
 * on the same day is not an error, it simply changes nothing —so nothing is written— and the
 * streak is reported all the same. A missing habit ends at RF-1.8, with the data untouched.
 */
export const doneCommand = (rawId: string, context: CommandContext): CommandResult => {
  const id = parseIdOrReport(rawId, context);
  if (id === undefined) return FAILED;

  const db = loadOrReport(context);
  if (db === undefined) return FAILED;

  const result = markDone(db, id, context.today);
  if (!result.ok) {
    context.stderr(`${errorText(result.code)}\n`);
    return FAILED;
  }

  const { habit, streak, alreadyMarked } = result.value;

  // The core gives the very same database back on a no-op, so there is nothing to save (RF-8.2).
  if (!alreadyMarked) saveDatabase(context.dataPath, result.value.db);

  context.stdout(
    `${alreadyMarked ? alreadyDoneToday(habit.name, streak) : markedDone(habit.name, streak)}\n`,
  );

  return SUCCEEDED;
};
