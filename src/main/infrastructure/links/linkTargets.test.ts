import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLinkTarget } from './linkTargets';

const context = { cwd: resolve('project'), homeDir: resolve('home') };

describe('parseLinkTarget', () => {
  it('passes http and https through as web links', () => {
    expect(parseLinkTarget('https://example.com/a?b=1', context)).toEqual({ kind: 'web', url: 'https://example.com/a?b=1' });
    expect(parseLinkTarget('HTTP://example.com', context)).toEqual({ kind: 'web', url: 'http://example.com/' });
  });

  it('rejects every other scheme', () => {
    expect(() => parseLinkTarget('vscode://file/x', context)).toThrow('Unsupported link: vscode://file/x');
    expect(() => parseLinkTarget('mailto:someone@example.com', context)).toThrow('Unsupported link');
    expect(() => parseLinkTarget('javascript:alert(1)', context)).toThrow('Unsupported link');
  });

  it('turns a file URL into its path', () => {
    const path = resolve('project', 'notes.md');
    expect(parseLinkTarget(pathToFileURL(path).href, context)).toEqual({ kind: 'path', path, position: undefined });
  });

  it('resolves a relative path against the cwd and splits off the line and column', () => {
    expect(parseLinkTarget('src/main/index.ts:14:3', context)).toEqual({
      kind: 'path',
      path: resolve('project', 'src/main/index.ts'),
      position: '14:3',
    });
    expect(parseLinkTarget('src/main/index.ts:14', context).kind).toBe('path');
  });

  it('keeps an absolute path and expands the home prefix', () => {
    const absolute = resolve('elsewhere', 'file.txt');
    expect(parseLinkTarget(absolute, context)).toEqual({ kind: 'path', path: absolute, position: undefined });
    expect(parseLinkTarget('~/.claude/settings.json', context)).toEqual({
      kind: 'path',
      path: resolve('home', '.claude/settings.json'),
      position: undefined,
    });
  });
});
