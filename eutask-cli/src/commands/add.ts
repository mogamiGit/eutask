// `eutask add <nombre>` — RF-1. No domain here: it loads, calls the core, saves and prints.

import { addHabit } from '../core.js';
import { errorText, habitCreated } from '../output.js';
import { saveDatabase } from '../storage.js';
import { FAILED, SUCCEEDED, loadOrReport, type CommandContext, type CommandResult } from './context.js';

/**
 * RF-1.1: creates the habit and answers with its id. An invalid or duplicate name (RF-1.3..1.6)
 * is reported on stderr and nothing is written, so a failed run leaves the file exactly as it
 * was. The save comes before the message: what the user reads is already on disk (RF-8.2).
 */
export const addCommand = (rawName: string, context: CommandContext): CommandResult => {
  const db = loadOrReport(context);
  if (db === undefined) return FAILED;

  const result = addHabit(db, rawName, context.today);
  if (!result.ok) {
    context.stderr(`${errorText(result.code)}\n`);
    return FAILED;
  }

  saveDatabase(context.dataPath, result.value.db);
  context.stdout(`${habitCreated(result.value.habit)}\n`);

  return SUCCEEDED;
};
