import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countTextLines, GitChangeCounter, sumNumstat } from './GitChangeCounter';

describe('sumNumstat', () => {
  it('adds every file and counts binary files as nothing', () => {
    expect(sumNumstat('3\t1\ta.ts\n-\t-\tlogo.png\n10\t0\tb.ts\n')).toEqual({ added: 13, removed: 1 });
    expect(sumNumstat('')).toEqual({ added: 0, removed: 0 });
  });
});

describe('countTextLines', () => {
  it('counts a last line without a newline and skips binary content', () => {
    expect(countTextLines(Buffer.from('a\nb\n'))).toBe(2);
    expect(countTextLines(Buffer.from('a\nb'))).toBe(2);
    expect(countTextLines(Buffer.from(''))).toBe(0);
    expect(countTextLines(Buffer.from([0x61, 0x00, 0x0a]))).toBe(0);
  });
});

describe('GitChangeCounter', () => {
  let repoDir: string;
  const git = (...args: string[]): void => {
    execFileSync('git', ['-C', repoDir, '-c', 'user.email=armada@test', '-c', 'user.name=armada', ...args], { stdio: 'ignore' });
  };

  beforeEach(async () => {
    repoDir = await mkdtemp(join(tmpdir(), 'armada-git-'));
  });

  afterEach(async () => {
    await rm(repoDir, { recursive: true, force: true });
  });

  it('has no count for a folder outside git', async () => {
    expect(await new GitChangeCounter().count(repoDir)).toBeUndefined();
  });

  it('counts uncommitted edits plus new files, and nothing once committed', async () => {
    git('init', '-q');
    await writeFile(join(repoDir, 'kept.ts'), 'one\ntwo\n');
    git('add', '.');
    git('commit', '-qm', 'start');
    await writeFile(join(repoDir, 'kept.ts'), 'one\nthree\nfour\n');
    await writeFile(join(repoDir, 'fresh.ts'), 'a\nb\nc\n');

    expect(await new GitChangeCounter().count(repoDir)).toEqual({ added: 5, removed: 1 });

    git('add', '.');
    git('commit', '-qm', 'done');
    expect(await new GitChangeCounter().count(repoDir)).toEqual({ added: 0, removed: 0 });
  });

  it('counts a repository with no commits yet', async () => {
    git('init', '-q');
    await writeFile(join(repoDir, 'first.ts'), 'a\nb\n');
    git('add', '.');
    expect(await new GitChangeCounter().count(repoDir)).toEqual({ added: 2, removed: 0 });
  });
});
