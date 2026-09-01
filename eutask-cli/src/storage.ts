// The only door to the disk (constitution, "Persistencia simple y explícita"). Everything that
// comes in is validated with zod before it reaches the core.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

import { emptyDatabase, type Database } from './core.js';

/** Why a stored file could not be read. The Spanish wording lives in output.ts. */
export type LoadErrorCode = 'INVALID_JSON' | 'INVALID_SCHEMA';

export type LoadResult =
  | { ok: true; db: Database }
  | { ok: false; code: LoadErrorCode; path: string };

const DATA_FILE_NAME = 'data.json';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const habitSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    createdAt: isoDate,
    marks: z.array(isoDate),
  })
  .strict();

/**
 * `version` is a literal on purpose: a file of another format is rejected, never guessed. The
 * schemas are strict because zod would otherwise drop any unknown field on the way in, and the
 * next save would write it out of existence.
 */
const databaseSchema = z
  .object({
    version: z.literal(1),
    nextId: z.number().int().positive(),
    habits: z.array(habitSchema),
  })
  .strict();

/**
 * RF-8.1 and D-11: `~/.eutask/data.json`, or `$EUTASK_HOME/data.json` when that variable
 * names a directory. The environment is a parameter so the tests can point it elsewhere.
 */
export const resolveDataPath = (env: NodeJS.ProcessEnv = process.env): string => {
  const configured = env['EUTASK_HOME'];
  const directory =
    configured === undefined || configured === '' ? join(homedir(), '.eutask') : configured;

  return join(directory, DATA_FILE_NAME);
};

/**
 * RF-8.4: no file yet means starting from an empty set, which is not an error. RF-8.5: broken
 * JSON or JSON that does not match the schema is reported and nothing is written.
 */
export const loadDatabase = (path: string): LoadResult => {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ok: true, db: emptyDatabase() };
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return { ok: false, code: 'INVALID_JSON', path };
  }

  const validated = databaseSchema.safeParse(parsed);
  if (!validated.success) return { ok: false, code: 'INVALID_SCHEMA', path };

  return { ok: true, db: validated.data };
};
