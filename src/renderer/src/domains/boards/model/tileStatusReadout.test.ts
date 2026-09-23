import { describe, expect, it } from 'vitest';
import type { SessionStatus } from '@shared/sessions/sessionSchemas';
import { contextLeftPercentage, modelLabel, sessionFolderLabel } from './tileStatusReadout';

const status = (overrides: Partial<SessionStatus>): SessionStatus => ({
  terminalId: '00000000-0000-4000-8000-000000000001',
  sessionId: '00000000-0000-4000-8000-000000000002',
  reportedAt: 1,
  ...overrides,
});

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

describe('modelLabel', () => {
  it('joins model and effort, and drops what is missing', () => {
    expect(modelLabel(status({ modelName: 'Opus 5.5', effortLevel: 'xhigh' }))).toBe('Opus 5.5 · xhigh');
    expect(modelLabel(status({ modelName: 'Opus 5.5' }))).toBe('Opus 5.5');
    expect(modelLabel(status({}))).toBeUndefined();
  });
});
