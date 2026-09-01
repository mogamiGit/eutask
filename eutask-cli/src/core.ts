// Pure domain core: it receives data and returns data. It never touches the clock,
// the file system or the terminal (constitution, "Núcleo puro").

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
