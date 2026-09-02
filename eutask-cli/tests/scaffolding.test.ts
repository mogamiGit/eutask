import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The scaffolding itself is the deliverable of T1, so it is what these tests pin down:
// the published entry point, strict type checking, and the dependency budget of the
// constitution (only commander, chalk, date-fns and zod are allowed).
//
// T17 adds the other rule that no other test can see, because it is about what the code does
// NOT do: the core stays pure.

const readSource = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const readJson = (relative: string): Record<string, unknown> =>
  JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')) as Record<
    string,
    unknown
  >;

const packageJson = readJson('../package.json');
const tsconfig = readJson('../tsconfig.json');

describe('package.json', () => {
  it('exposes the eutask binary from the compiled entry point', () => {
    expect(packageJson['bin']).toEqual({ eutask: 'dist/cli.js' });
  });

  it('requires Node 20 or newer', () => {
    expect(packageJson['engines']).toMatchObject({ node: '>=20' });
  });

  it('ships only the four dependencies the constitution allows', () => {
    const dependencies = packageJson['dependencies'] as Record<string, string>;
    expect(Object.keys(dependencies).sort()).toEqual(['chalk', 'commander', 'date-fns', 'zod']);
  });
});

describe('tsconfig.json', () => {
  it('type checks in strict mode', () => {
    const compilerOptions = tsconfig['compilerOptions'] as Record<string, unknown>;
    expect(compilerOptions['strict']).toBe(true);
  });
});

describe('the pure core (constitution, "Núcleo puro")', () => {
  const core = readSource('../src/core.ts');

  const importedModules = [...core.matchAll(/from '([^']+)'/g)].map((match) => match[1]);

  it('imports nothing but date-fns', () => {
    // A single import is not a rule of its own: the point is that fs, process, chalk and
    // commander stay out, so the core keeps receiving data and returning data.
    expect(importedModules).toEqual(['date-fns']);
  });

  it('never reads the clock, so `today` can only come in as a parameter (RF-3.1)', () => {
    expect(core).not.toMatch(/new Date\(|Date\.now\(/);
  });

  it('carries no user facing wording, which belongs in output.ts (constitution, "Idioma")', () => {
    // Every message is in Spanish and Spanish needs accents; finding one here means a sentence
    // escaped from output.ts into the domain.
    expect(core.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')).not.toMatch(/[áéíóúñ¿¡«»]/i);
  });
});
