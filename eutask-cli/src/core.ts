// Pure domain core: it receives data and returns data. It never touches the clock,
// the file system or the terminal (constitution, "Núcleo puro").

import { format, parseISO, subDays } from 'date-fns';

/** A local calendar day as 'YYYY-MM-DD'. Never an UTC instant. */
export type IsoDate = string;

export type Habit = {
  id: number;
  name: string;
  createdAt: IsoDate;
  /** Local days already fulfilled, ascending and without duplicates. */
  marks: IsoDate[];
};

export type Database = {
  version: 1;
  /** Next id to hand out. Monotonic: removing a habit never gives its id back (RF-1.7). */
  nextId: number;
  habits: Habit[];
};

export type ErrorCode =
  | 'EMPTY_NAME'
  | 'NAME_TOO_LONG'
  | 'NAME_NOT_SINGLE_LINE'
  | 'DUPLICATE_NAME'
  | 'INVALID_ID'
  | 'HABIT_NOT_FOUND';

/** Domain errors are expected outcomes, so they travel in the return type instead of throwing. */
export type Result<T> = { ok: true; value: T } | { ok: false; code: ErrorCode };

export const MAX_NAME_LENGTH = 60;

/** Any Unicode control character, line breaks and tabs included. */
const CONTROL_CHARACTER = /\p{Cc}/u;

/** A positive base 10 integer: no sign, no decimals, no leading zeros. */
const HABIT_ID = /^[1-9][0-9]*$/;

const ok = <T>(value: T): Result<T> => ({ ok: true, value });

const fail = (code: ErrorCode): Result<never> => ({ ok: false, code });

/** RF-8.4: the starting point when there are no stored data yet. */
export const emptyDatabase = (): Database => ({ version: 1, nextId: 1, habits: [] });

/**
 * RF-1.2 and RF-1.6: trim, then normalise to NFC. Storing the normalised name turns the
 * duplicate check into plain string equality, which keeps case and accents apart.
 */
export const normalizeName = (raw: string): string => raw.trim().normalize('NFC');

/**
 * RF-1.3, RF-1.4, RF-1.5 and RF-5.2. The order matters: a lone tab is an empty name once
 * trimmed, and the length is measured on the normalised name.
 */
export const validateName = (raw: string): Result<string> => {
  const name = normalizeName(raw);

  if (name === '') return fail('EMPTY_NAME');
  if (CONTROL_CHARACTER.test(name)) return fail('NAME_NOT_SINGLE_LINE');
  // Code points, not UTF-16 units, so an emoji counts as one character (D-8).
  if ([...name].length > MAX_NAME_LENGTH) return fail('NAME_TOO_LONG');

  return ok(name);
};

/** RF-1.8: rejects '0', '-1', '1.5', '007', '1e3', ' 1 ' and anything non numeric. */
export const parseHabitId = (raw: string): Result<number> =>
  HABIT_ID.test(raw) ? ok(Number(raw)) : fail('INVALID_ID');

/** The day before, through date-fns: millisecond arithmetic would break on DST changes. */
const previousDay = (date: IsoDate): IsoDate => format(subDays(parseISO(date), 1), 'yyyy-MM-dd');

/**
 * RF-3: consecutive marked days counted backwards. From today when it is marked (RF-3.2),
 * from yesterday when it is not, so the streak stays alive all day long (RF-3.3), and 0
 * otherwise (RF-3.4, RF-3.5). `today` is a parameter: the core never reads the clock (RF-3.1).
 */
export const computeStreak = (marks: readonly IsoDate[], today: IsoDate): number => {
  const marked = new Set(marks);
  const yesterday = previousDay(today);

  let cursor: IsoDate;
  if (marked.has(today)) cursor = today;
  else if (marked.has(yesterday)) cursor = yesterday;
  else return 0;

  // Each turn consumes a different marked day, so the loop is bounded by the marks.
  let streak = 0;
  while (marked.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }

  return streak;
};

/**
 * RF-1.1: registers the habit with the id taken from `nextId` (RF-1.7) and no marks, so its
 * streak starts at 0. RF-1.6: names are stored already trimmed and in NFC, so the duplicate
 * check is plain string equality and keeps case and accents apart.
 */
export const addHabit = (
  db: Database,
  rawName: string,
  today: IsoDate,
): Result<{ db: Database; habit: Habit }> => {
  const validated = validateName(rawName);
  if (!validated.ok) return fail(validated.code);

  const name = validated.value;
  if (db.habits.some((each) => each.name === name)) return fail('DUPLICATE_NAME');

  const habit: Habit = { id: db.nextId, name, createdAt: today, marks: [] };

  return ok({
    db: { ...db, nextId: db.nextId + 1, habits: [...db.habits, habit] },
    habit,
  });
};

/** The same database with one habit replaced. The original is left untouched. */
const withHabit = (db: Database, habit: Habit): Database => ({
  ...db,
  habits: db.habits.map((each) => (each.id === habit.id ? habit : each)),
});

/**
 * RF-2: marks today as fulfilled. Idempotent: when the mark was already there the very same
 * database comes back with `alreadyMarked`, so nothing is written and the caller still gets
 * the streak in force (RF-2.2).
 */
export const markDone = (
  db: Database,
  id: number,
  today: IsoDate,
): Result<{ db: Database; habit: Habit; streak: number; alreadyMarked: boolean }> => {
  const current = db.habits.find((each) => each.id === id);
  if (current === undefined) return fail('HABIT_NOT_FOUND');

  if (current.marks.includes(today)) {
    return ok({
      db,
      habit: current,
      streak: computeStreak(current.marks, today),
      alreadyMarked: true,
    });
  }

  // 'YYYY-MM-DD' sorts alphabetically in chronological order, so the default comparator holds.
  const habit: Habit = { ...current, marks: [...current.marks, today].sort() };

  return ok({
    db: withHabit(db, habit),
    habit,
    streak: computeStreak(habit.marks, today),
    alreadyMarked: false,
  });
};

/**
 * RF-7: withdraws the mark of today and only that one, so the previous days stay put
 * (RF-7.1). Idempotent as well: with no mark for today nothing changes (RF-7.2).
 */
export const markUndone = (
  db: Database,
  id: number,
  today: IsoDate,
): Result<{ db: Database; habit: Habit; streak: number; wasNotMarked: boolean }> => {
  const current = db.habits.find((each) => each.id === id);
  if (current === undefined) return fail('HABIT_NOT_FOUND');

  if (!current.marks.includes(today)) {
    return ok({
      db,
      habit: current,
      streak: computeStreak(current.marks, today),
      wasNotMarked: true,
    });
  }

  const habit: Habit = { ...current, marks: current.marks.filter((mark) => mark !== today) };

  return ok({
    db: withHabit(db, habit),
    habit,
    streak: computeStreak(habit.marks, today),
    wasNotMarked: false,
  });
};

/**
 * RF-5: only the name changes, so the id and the marks —and with them the streak— stay put
 * (RF-5.3). The new name goes through the rules of RF-1.2..1.5 (RF-5.2) and cannot be the one
 * of another habit (RF-5.4). Renaming a habit to its current name is accepted as a change with
 * no effect and brings the same database back (RF-5.5).
 */
export const renameHabit = (
  db: Database,
  id: number,
  rawName: string,
): Result<{ db: Database; habit: Habit; unchanged: boolean }> => {
  const current = db.habits.find((each) => each.id === id);
  if (current === undefined) return fail('HABIT_NOT_FOUND');

  const validated = validateName(rawName);
  if (!validated.ok) return fail(validated.code);

  const name = validated.value;
  if (name === current.name) return ok({ db, habit: current, unchanged: true });

  if (db.habits.some((each) => each.id !== id && each.name === name)) return fail('DUPLICATE_NAME');

  const habit: Habit = { ...current, name };

  return ok({ db: withHabit(db, habit), habit, unchanged: false });
};

/**
 * RF-6.1: takes the habit and all its marks away. `nextId` is left alone, so the id of what
 * has just been deleted is never handed out again (RF-1.7).
 */
export const removeHabit = (db: Database, id: number): Result<{ db: Database; habit: Habit }> => {
  const habit = db.habits.find((each) => each.id === id);
  if (habit === undefined) return fail('HABIT_NOT_FOUND');

  return ok({
    db: { ...db, habits: db.habits.filter((each) => each.id !== id) },
    habit,
  });
};

/** What the list command shows of a habit (RF-4.1). */
export type HabitView = { id: number; name: string; streak: number; doneToday: boolean };

/** RF-4.1: whether the habit is already fulfilled on the given day. */
export const isDoneToday = (habit: Habit, today: IsoDate): boolean => habit.marks.includes(today);

/**
 * RF-4.1 and RF-4.2: every habit with its streak and the state of today, from the longest
 * streak to the shortest and, on a tie, by id ascending so the output is always the same.
 * `map` builds a new array, so sorting it never reorders the habits of the caller.
 */
export const listHabits = (db: Database, today: IsoDate): HabitView[] =>
  db.habits
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      streak: computeStreak(habit.marks, today),
      doneToday: isDoneToday(habit, today),
    }))
    .sort((left, right) => right.streak - left.streak || left.id - right.id);
