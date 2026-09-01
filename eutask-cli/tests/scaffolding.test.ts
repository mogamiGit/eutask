import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The scaffolding itself is the deliverable of T1, so it is what these tests pin down:
// the published entry point, strict type checking, and the dependency budget of the
// constitution (only commander, chalk, date-fns and zod are allowed).

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
