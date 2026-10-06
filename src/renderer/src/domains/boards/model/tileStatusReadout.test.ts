import { describe, expect, it } from 'vitest';
import { contextLeftPercentage, contextSizeLabel, durationLabel, sessionFolderLabel, shortModelName } from './tileStatusReadout';

describe('contextLeftPercentage', () => {
  it('counts down to the auto-compact point, not to an empty window', () => {
    expect(contextLeftPercentage({ remainingPercentage: 100, size: 200_000 })).toBe(100);
    expect(contextLeftPercentage({ remainingPercentage: 16.5, size: 200_000 })).toBe(0);
    expect(contextLeftPercentage({ remainingPercentage: 58.25, size: 200_000 })).toBe(50);
  });

  it('stays inside 0 to 100', () => {
    expect(contextLeftPercentage({ remainingPercentage: 5, size: 200_000 })).toBe(0);
    expect(contextLeftPercentage({ remainingPercentage: 100, size: 20_000 })).toBe(100);
  });
});

describe('sessionFolderLabel', () => {
  it('shows nothing while the session sits in its project folder', () => {
    expect(sessionFolderLabel('C:\\dev\\armada', 'C:/dev/armada/')).toBeUndefined();
    expect(sessionFolderLabel('C:\\dev\\armada', 'c:\\dev\\Armada')).toBeUndefined();
    expect(sessionFolderLabel('C:\\dev\\armada', undefined)).toBeUndefined();
  });

  it('shows a subfolder relative to the project', () => {
    expect(sessionFolderLabel('C:\\dev\\armada', 'C:\\dev\\armada\\src\\renderer')).toBe('./src/renderer');
  });

  it('shows a folder outside the project in full', () => {
    expect(sessionFolderLabel('C:\\dev\\armada', 'C:\\dev\\armada-docs')).toBe('C:/dev/armada-docs');
  });
});

describe('shortModelName', () => {
  it('drops the context note Claude Code appends to the model name', () => {
    expect(shortModelName('Opus 5.5 (1M context)')).toBe('Opus 5.5');
    expect(shortModelName('Sonnet 5.5')).toBe('Sonnet 5.5');
  });
});

describe('contextSizeLabel', () => {
  it('writes millions as M and thousands as K', () => {
    expect(contextSizeLabel(1_000_000)).toBe('1M');
    expect(contextSizeLabel(200_000)).toBe('200K');
  });
});

describe('durationLabel', () => {
  it('shows minutes, and hours with padded minutes past the hour', () => {
    expect(durationLabel(59_000)).toBe('0m');
    expect(durationLabel(42 * 60_000)).toBe('42m');
    expect(durationLabel((65 * 60 + 30) * 1000)).toBe('1h 05m');
  });
});
