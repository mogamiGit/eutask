// The only helper of the end to end tests: it launches the real binary in its own process, the
// single level that sees exit codes and the absence of a terminal. No new dependency (plan, §6).

import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const compiledCli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));
const typescriptCompiler = fileURLToPath(
  new URL('../../node_modules/typescript/bin/tsc', import.meta.url),
);

export type RunResult = { stdout: string; stderr: string; code: number };

/**
 * The tests run the compiled binary, so the sources have to be built first. It is done once per
 * file, in a `beforeAll`, and not through npm to keep the startup out of the measurement.
 */
export const buildCli = (): void => {
  execFileSync(process.execPath, [typescriptCompiler, '-p', 'tsconfig.build.json'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });
};

/**
 * `eutask <args>` against a data directory of its own. stdin is closed on purpose: a test suite
 * is not a terminal, which is exactly the situation RF-6.4 describes.
 */
export const run = (args: string[], home: string): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [compiledCli, ...args], {
      env: { ...process.env, EUTASK_HOME: home },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => (stdout += chunk));
    child.stderr.on('data', (chunk: string) => (stderr += chunk));

    child.on('error', reject);
    // A process killed by a signal reports no code; it is a failure all the same.
    child.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
