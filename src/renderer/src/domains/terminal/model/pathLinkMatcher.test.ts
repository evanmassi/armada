import { describe, expect, it } from 'vitest';
import { continuesOnNextRow, findPathLinks } from './pathLinkMatcher';

describe('continuesOnNextRow', () => {
  it('joins a path Claude Code broke at the right edge onto an indented next row', () => {
    expect(
      continuesOnNextRow(
        String.raw`● C:\Users\someone\Tools\Emulators\emulator-v0.18.0\launche`,
        String.raw`  r\EmulatorLauncher.exe          `,
      ),
    ).toBe(true);
  });

  it('leaves a row alone when it stops short of the edge, ends in a plain word, or the next row is blank', () => {
    expect(continuesOnNextRow(String.raw`see C:\dev\armada `, '  AGENTS.md')).toBe(false);
    expect(continuesOnNextRow('the settings live in the file', '  src/config.ts')).toBe(false);
    expect(continuesOnNextRow(String.raw`C:\dev\armada\src`, '        ')).toBe(false);
  });
});

const textsIn = (line: string): string[] => findPathLinks(line).map((match) => match.text);

describe('findPathLinks', () => {
  it('finds rooted paths with either separator', () => {
    expect(textsIn(String.raw`● Wrote C:\dev\armada\src\main\index.ts and ~/.claude/settings.json`)).toEqual([
      String.raw`C:\dev\armada\src\main\index.ts`,
      '~/.claude/settings.json',
    ]);
    expect(textsIn('see ./docs and ../armada/build/')).toEqual(['./docs', '../armada/build/']);
  });

  it('keeps a line and column suffix and reports where the match starts', () => {
    expect(findPathLinks('  at src/main/index.ts:14:3')).toEqual([{ text: 'src/main/index.ts:14:3', startIndex: 5 }]);
  });

  it('takes an unrooted path only when it ends in a file extension', () => {
    expect(textsIn('read .claude/settings.json and/or src/main on 09/17/2026 over TCP/IP v1.0/v2.0')).toEqual([
      '.claude/settings.json',
    ]);
  });

  it('drops wrapping punctuation and a sentence-ending period', () => {
    expect(textsIn('Edited (src/shared/armadaApi.ts), then `src/preload/index.ts`.')).toEqual([
      'src/shared/armadaApi.ts',
      'src/preload/index.ts',
    ]);
    expect(textsIn('It lives in src/main/index.ts.')).toEqual(['src/main/index.ts']);
  });

  it('leaves web addresses to the URL matcher', () => {
    expect(textsIn('https://github.com/xtermjs/xterm.js/blob/master/README.md')).toEqual([]);
  });
});
