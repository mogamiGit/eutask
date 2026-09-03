// `eutask list` — RF-4. It only reads: nothing is written, not even the file itself.

import { listHabits } from '../core.js';
import { habitsTable, noHabitsYet } from '../output.js';
import { FAILED, SUCCEEDED, loadOrReport, type CommandContext, type CommandResult } from './context.js';

/**
 * RF-4.1 and RF-4.2: the table in the order the core gives it. RF-4.3: no habits yet is a normal
 * outcome, so it succeeds and points at how to create the first one.
 */
export const listCommand = (context: CommandContext): CommandResult => {
  const db = loadOrReport(context);
  if (db === undefined) return FAILED;

  const habits = listHabits(db, context.today);

  context.stdout(`${habits.length === 0 ? noHabitsYet() : habitsTable(habits)}\n`);

  return SUCCEEDED;
};
