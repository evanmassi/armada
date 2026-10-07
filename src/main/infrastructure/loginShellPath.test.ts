import { delimiter } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mergePathLists } from './loginShellPath';

const pathOf = (...dirs: string[]): string => dirs.join(delimiter);

describe('mergePathLists', () => {
  it('puts the login shell folders first and keeps the rest without repeats or blanks', () => {
    expect(
      mergePathLists(pathOf('/Users/someone/.local/bin', '/usr/local/bin', '/usr/bin', ''), pathOf('/usr/bin', '/bin', '/sbin')),
    ).toBe(pathOf('/Users/someone/.local/bin', '/usr/local/bin', '/usr/bin', '/bin', '/sbin'));
  });

  it('keeps the current PATH when the login shell reports nothing', () => {
    expect(mergePathLists('', pathOf('/usr/bin', '/bin'))).toBe(pathOf('/usr/bin', '/bin'));
  });
});
