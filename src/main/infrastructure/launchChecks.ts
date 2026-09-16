import { existsSync } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';

// PITFALL: node-pty resolves a bare command by exact filename on PATH and fails with an empty "File not found: " otherwise.
export const resolveOnPath = (command: string): string | undefined => {
  if (isAbsolute(command)) return existsSync(command) ? command : undefined;
  return (process.env['PATH'] ?? '')
    .split(delimiter)
    .filter((dir) => dir.length > 0)
    .map((dir) => join(dir, command))
    .find((candidate) => existsSync(candidate));
};

export function assertLaunchable(command: string, cwd: string): void {
  if (!existsSync(cwd)) throw new Error(`Folder no longer exists: ${cwd}`);
  if (resolveOnPath(command) === undefined) throw new Error(`${command} was not found on PATH`);
}
