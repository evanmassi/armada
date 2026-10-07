import { execFileSync } from 'node:child_process';
import { delimiter } from 'node:path';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const PATH_MARKER = '__ARMADA_PATH__';
const LOGIN_SHELL_TIMEOUT_MS = 5000;

const readLoginShellPath = (shell: string): string =>
  execFileSync(shell, ['-ilc', `printf '${PATH_MARKER}%s${PATH_MARKER}' "$PATH"`], {
    encoding: 'utf8',
    timeout: LOGIN_SHELL_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).split(PATH_MARKER)[1] ?? '';

export const mergePathLists = (preferred: string, current: string): string =>
  [...new Set([...preferred.split(delimiter), ...current.split(delimiter)].filter((dir) => dir.length > 0))].join(delimiter);

// PITFALL: a Mac app opened from the Dock or Finder gets only /usr/bin:/bin:/usr/sbin:/sbin, so claude, node and code stay missing until PATH comes from the login shell.
export function adoptLoginShellPath(logger: FileLogger): void {
  if (process.platform !== 'darwin') return;
  try {
    process.env['PATH'] = mergePathLists(readLoginShellPath(process.env['SHELL'] || '/bin/zsh'), process.env['PATH'] ?? '');
  } catch (error) {
    logger.error('path.loginShellFailed', { error });
  }
}
