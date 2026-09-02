// Asking before an irreversible deletion (RF-6.2). Only `node:readline` and `isTTY`: a yes or
// no does not justify another dependency (D-10).

import { createInterface } from 'node:readline';

/** What the `[s/N]` of the question offers. Anything else means no. */
const AFFIRMATIVE = new Set(['s', 'si', 'sí']);

/**
 * RF-6.2: only an explicit yes goes through. The answer is trimmed, lowercased and normalised
 * to NFC, so an accent typed as a separate character counts the same.
 */
export const isAffirmative = (answer: string): boolean =>
  AFFIRMATIVE.has(answer.trim().toLowerCase().normalize('NFC'));

/**
 * RF-6.4: a pipe or a redirection is not a terminal, and there nobody can answer. The stream is
 * a parameter so the tests do not have to fake the real stdin.
 */
export const isInteractive = (
  stream: NodeJS.ReadableStream | { isTTY?: boolean } = process.stdin,
): boolean => 'isTTY' in stream && stream.isTTY === true;

/**
 * Writes the question and waits for one line. If the input ends before any answer arrives the
 * answer is no: cancelling is the safe outcome when what follows cannot be undone.
 */
export const askConfirmation = async (
  question: string,
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stdout,
): Promise<boolean> => {
  const readline = createInterface({ input, output });

  try {
    const answer = await new Promise<string>((resolve) => {
      readline.question(question, resolve);
      readline.once('close', () => resolve(''));
    });

    return isAffirmative(answer);
  } finally {
    readline.close();
  }
};
