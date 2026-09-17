import { existsSync, lstatSync } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';

// PITFALL: a Microsoft Store install puts a zero-byte alias on PATH; existsSync follows it, is denied access, and reports a launchable command as missing.
const isCommandFile = (candidate: string): boolean => {
  try {
    return !lstatSync(candidate).isDirectory();
  } catch {
    return false;
  }
};

// PITFALL: node-pty resolves a bare command by exact filename on PATH and fails with an empty "File not found: " otherwise.
export const resolveOnPath = (command: string): string | undefined => {
  if (isAbsolute(command)) return isCommandFile(command) ? command : undefined;
  return (process.env['PATH'] ?? '')
    .split(delimiter)
    .filter((dir) => dir.length > 0)
    .map((dir) => join(dir, command))
    .find(isCommandFile);
};

export function assertLaunchable(command: string, cwd: string): void {
  if (!existsSync(cwd)) throw new Error(`Folder no longer exists: ${cwd}`);
  if (resolveOnPath(command) === undefined) throw new Error(`${command} was not found on PATH`);
}
