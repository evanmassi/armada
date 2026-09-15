import { describe, expect, it } from 'vitest';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { ensureProjectColor, pickUnusedProjectColor } from './projectColorEdits';

const workspace = (projectColors: Workspace['projectColors']): Workspace => ({
  boards: [],
  projectColors,
  pinnedSessionIds: [],
  preferences: { terminalFontSize: 13 },
  sidebar: { width: 288, groups: [], projectOrder: [], archivedProjectCwds: [], archivedSessionIds: [], projectAliases: {}, projectExpansion: {} },
});

describe('pickUnusedProjectColor', () => {
  it('walks the palette skipping colors already in use, ignoring case', () => {
    expect(pickUnusedProjectColor([])).toBe('#ef4444');
    expect(pickUnusedProjectColor(['#EF4444', '#f97316'])).toBe('#f59e0b');
  });
});

describe('ensureProjectColor', () => {
  it('assigns a color only when the project has none', () => {
    const assigned = ensureProjectColor(workspace({ 'C:\\a': '#ef4444' }), 'C:\\b');
    expect(assigned.projectColors).toEqual({ 'C:\\a': '#ef4444', 'C:\\b': '#f97316' });
    expect(ensureProjectColor(assigned, 'C:\\a')).toBe(assigned);
  });
});
