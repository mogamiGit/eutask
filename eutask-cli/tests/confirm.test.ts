import { PassThrough, Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';

import { askConfirmation, isAffirmative, isInteractive } from '../src/confirm.js';

// T11 — removing is irreversible, so only an explicit yes goes through (RF-6.2, RF-6.4).

/** A pipe, never a terminal: what the tests and a script both see. */
const answerOf = (typed: string): Readable => Readable.from([typed]);

const collector = (): { stream: PassThrough; written: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));

  return { stream, written: () => chunks.join('') };
};

describe('isAffirmative (RF-6.2)', () => {
  it.each(['s', 'S', 'si', 'sí', 'SI', 'SÍ', 'Sí', '  s  ', 's\n'])(
    'takes %j as a yes',
    (answer) => {
      expect(isAffirmative(answer)).toBe(true);
    },
  );

  it.each([
    ['an empty answer, which is the default No', ''],
    ['only spaces', '   '],
    ['a plain no', 'n'],
    ['a spelled no', 'no'],
    ['the English yes', 'y'],
    ['the English spelled yes', 'yes'],
    ['a word that merely starts with s', 'seguro'],
    ['a word that contains si', 'quizás sí me apetece'],
    ['anything else', 'claro que sí'],
  ])('does not take %s as a yes', (_case, answer) => {
    expect(isAffirmative(answer)).toBe(false);
  });

  it('accepts the accent written apart, as some keyboards send it', () => {
    expect(isAffirmative('sí')).toBe(true);
  });
});

describe('isInteractive (RF-6.4)', () => {
  it('is true only for a stream that is a terminal', () => {
    expect(isInteractive({ isTTY: true })).toBe(true);
    expect(isInteractive({ isTTY: false })).toBe(false);
    expect(isInteractive({})).toBe(false);
  });

  it('is false for a pipe, which is what a script gives', () => {
    expect(isInteractive(answerOf('s\n'))).toBe(false);
  });
});

describe('askConfirmation (RF-6.2, RF-6.5)', () => {
  it('writes the question and answers true on an explicit yes', async () => {
    const output = collector();

    const confirmed = await askConfirmation('¿Eliminar «X»? [s/N] ', answerOf('s\n'), output.stream);

    expect(confirmed).toBe(true);
    expect(output.written()).toContain('¿Eliminar «X»? [s/N] ');
  });

  it('answers false on a no (RF-6.5)', async () => {
    const output = collector();

    expect(await askConfirmation('¿Seguro? ', answerOf('no\n'), output.stream)).toBe(false);
  });

  it('answers false when the user just presses enter', async () => {
    const output = collector();

    expect(await askConfirmation('¿Seguro? ', answerOf('\n'), output.stream)).toBe(false);
  });

  it('answers false when the input ends without any answer', async () => {
    // Nothing to read: cancelling is the safe outcome for an irreversible operation.
    const output = collector();

    expect(await askConfirmation('¿Seguro? ', answerOf(''), output.stream)).toBe(false);
  });

  it('reads only the first line', async () => {
    const output = collector();

    expect(await askConfirmation('¿Seguro? ', answerOf('s\nno\n'), output.stream)).toBe(true);
  });
});
