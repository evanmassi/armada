import { describe, expect, it } from 'vitest';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { ensureProjectColor, pickUnusedProjectColor } from './projectColorEdits';

const workspace = (projectColors: Workspace['projectColors']): Workspace => ({
  boards: [],
  projectColors,
  pinnedSessionIds: [],
  preferences: { terminalFontSize: 13 },
  sidebar: { width: 288, groups: [], projectOrder: [], archivedProjectCwds: [], archivedSessionIds: [], projectAliases: {} },
});

describe('pickUnusedProjectColor', () => {
  it('skips greys and colors already in use', () => {
    expect(pickUnusedProjectColor([])).toBe('red');
    expect(pickUnusedProjectColor(['red', 'rose'])).toBe('pink');
  });
});

describe('ensureProjectColor', () => {
  it('assigns a color only when the project has none', () => {
    const assigned = ensureProjectColor(workspace({ 'C:\\a': 'red' }), 'C:\\b');
    expect(assigned.projectColors).toEqual({ 'C:\\a': 'red', 'C:\\b': 'rose' });
    expect(ensureProjectColor(assigned, 'C:\\a')).toBe(assigned);
  });
});
