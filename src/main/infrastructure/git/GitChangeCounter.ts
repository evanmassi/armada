import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ProjectLineChanges } from '@shared/projects/projectSchemas';

const runFile = promisify(execFile);

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const MAX_UNTRACKED_FILE_BYTES = 1_000_000;
const GIT_OUTPUT_LIMIT_BYTES = 32_000_000;

export function sumNumstat(numstat: string): ProjectLineChanges {
  let added = 0;
  let removed = 0;
  for (const line of numstat.split('\n')) {
    const [addedColumn, removedColumn] = line.split('\t');
    added += Number(addedColumn) || 0;
    removed += Number(removedColumn) || 0;
  }
  return { added, removed };
}

export function countTextLines(content: Buffer): number {
  if (content.length === 0 || content.includes(0)) return 0;
  const newlines = content.reduce((count, byte) => (byte === 0x0a ? count + 1 : count), 0);
  return content[content.length - 1] === 0x0a ? newlines : newlines + 1;
}

export class GitChangeCounter {
  async count(cwd: string): Promise<ProjectLineChanges | undefined> {
    const git = async (...args: string[]): Promise<string> =>
      (await runFile('git', ['-C', cwd, ...args], { windowsHide: true, maxBuffer: GIT_OUTPUT_LIMIT_BYTES })).stdout;
    try {
      await git('rev-parse', '--show-toplevel');
    } catch {
      return undefined;
    }
    const base = await git('rev-parse', '-q', '--verify', 'HEAD').then(
      (head) => head.trim(),
      () => EMPTY_TREE_HASH,
    );
    const tracked = sumNumstat(await git('diff', '--numstat', '--no-renames', base, '--', '.'));
    const untrackedPaths = (await git('ls-files', '--others', '--exclude-standard', '-z')).split('\0').filter(Boolean);
    const untrackedLines = await Promise.all(untrackedPaths.map((path) => this.countUntrackedLines(join(cwd, path))));
    return { added: tracked.added + untrackedLines.reduce((total, lines) => total + lines, 0), removed: tracked.removed };
  }

  private async countUntrackedLines(file: string): Promise<number> {
    try {
      if ((await stat(file)).size > MAX_UNTRACKED_FILE_BYTES) return 0;
      return countTextLines(await readFile(file));
    } catch {
      return 0;
    }
  }
}
