// `eutask remove <id> [--yes]` — RF-6. The only command that asks before acting, because it is
// the only one that cannot be undone.

import { removeHabit } from '../core.js';
import {
  confirmRemoval,
  errorText,
  habitRemoved,
  removalCancelled,
  removalNeedsConfirmation,
} from '../output.js';
import { saveDatabase } from '../storage.js';
import {
  FAILED,
  SUCCEEDED,
  loadOrReport,
  parseIdOrReport,
  type CommandContext,
  type CommandResult,
} from './context.js';

export type RemoveOptions = { yes: boolean };

/**
 * RF-6.1: takes the habit and all its marks away. The habit is looked up first, so a wrong id is
 * answered before anybody is asked anything (RF-1.8) and the question can name what is at stake
 * (RF-6.2). RF-6.3: `--yes` skips the question, for scripts. RF-6.4: without a terminal and
 * without `--yes` there is nobody who could answer, so it stops without deleting. RF-6.5: a
 * negative answer is a normal outcome, not a failure.
 */
export const removeCommand = async (
  rawId: string,
  options: RemoveOptions,
  context: CommandContext,
): Promise<CommandResult> => {
  const id = parseIdOrReport(rawId, context);
  if (id === undefined) return FAILED;

  const db = loadOrReport(context);
  if (db === undefined) return FAILED;

  const result = removeHabit(db, id);
  if (!result.ok) {
    context.stderr(`${errorText(result.code)}\n`);
    return FAILED;
  }

  const { habit } = result.value;

  if (!options.yes) {
    if (!context.interactive) {
      context.stderr(`${removalNeedsConfirmation()}\n`);
      return FAILED;
    }

    if (!(await context.confirm(confirmRemoval(habit.name)))) {
      context.stdout(`${removalCancelled()}\n`);
      return SUCCEEDED;
    }
  }

  saveDatabase(context.dataPath, result.value.db);
  context.stdout(`${habitRemoved(habit.id)}\n`);

  return SUCCEEDED;
};
