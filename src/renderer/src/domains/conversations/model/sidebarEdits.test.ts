import { describe, expect, it } from 'vitest';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { moveGroup, moveProject, removeSidebarGroup, setProjectAlias, setProjectArchived, setProjectExpanded, sortSidebarProjects } from './sidebarEdits';

const workspace = (): Workspace => ({
  boards: [],
  projectColors: {},
  pinnedSessionIds: [],
  preferences: { terminalFontSize: 13 },
  sidebar: {
    width: 288,
    groups: [
      { id: 'g1', name: 'Work', projectCwds: ['a', 'b'], isCollapsed: false },
      { id: 'g2', name: 'Life', projectCwds: ['c'], isCollapsed: false },
    ],
    projectOrder: ['d'],
    archivedProjectCwds: ['e'],
    archivedSessionIds: [],
    projectAliases: {},
    projectExpansion: {},
  },
});

describe('moveProject', () => {
  it('moves a project between groups before a sibling', () => {
    const { sidebar } = moveProject(workspace(), 'c', { groupId: 'g1', beforeCwd: 'b' }, ['d', 'f']);
    expect(sidebar.groups.map((group) => group.projectCwds)).toEqual([['a', 'c', 'b'], []]);
  });

  it('moves a project out of a group into Other, using the displayed order, and unarchives it', () => {
    const { sidebar } = moveProject(workspace(), 'e', { groupId: undefined, beforeCwd: 'f' }, ['d', 'f']);
    expect(sidebar.projectOrder).toEqual(['d', 'e', 'f']);
    expect(sidebar.archivedProjectCwds).toEqual([]);
  });

  it('appends when there is no sibling to insert before', () => {
    expect(moveProject(workspace(), 'd', { groupId: 'g2' }, ['d']).sidebar.groups[1]!.projectCwds).toEqual(['c', 'd']);
  });

  it('keeps persisted slots of projects missing from the displayed order', () => {
    const start = workspace();
    start.sidebar.projectOrder = ['d', 'hidden', 'e'];
    const { sidebar } = moveProject(start, 'c', { groupId: undefined, beforeCwd: 'd' }, ['d']);
    expect(sidebar.projectOrder).toEqual(['c', 'd', 'hidden', 'e']);
  });
});

describe('moveGroup', () => {
  it('places a group before another and appends without a target', () => {
    expect(moveGroup(workspace(), 'g2', 'g1').sidebar.groups.map((group) => group.id)).toEqual(['g2', 'g1']);
    expect(moveGroup(workspace(), 'g1', undefined).sidebar.groups.map((group) => group.id)).toEqual(['g2', 'g1']);
    expect(moveGroup(workspace(), 'missing', 'g1').sidebar.groups.map((group) => group.id)).toEqual(['g1', 'g2']);
  });
});

describe('sortSidebarProjects', () => {
  it('sorts every group and the Other list with the given comparator', () => {
    const { sidebar } = sortSidebarProjects(workspace(), (a, b) => b.localeCompare(a), ['d', 'f']);
    expect(sidebar.groups[0]!.projectCwds).toEqual(['b', 'a']);
    expect(sidebar.projectOrder).toEqual(['f', 'd']);
  });

  it('keeps archived projects in their persisted slot after a sort', () => {
    const start = workspace();
    start.sidebar.projectOrder = ['d', 'e', 'f'];
    expect(sortSidebarProjects(start, (a, b) => b.localeCompare(a), ['d', 'f']).sidebar.projectOrder).toEqual(['f', 'd', 'e']);
  });
});

describe('removeSidebarGroup', () => {
  it('returns the group members to the end of Other', () => {
    const { sidebar } = removeSidebarGroup(workspace(), 'g1');
    expect(sidebar.groups.map((group) => group.id)).toEqual(['g2']);
    expect(sidebar.projectOrder).toEqual(['d', 'a', 'b']);
  });
});

describe('setProjectExpanded', () => {
  it('remembers each project toggle independently', () => {
    const expanded = setProjectExpanded(setProjectExpanded(workspace(), 'a', false), 'b', true);
    expect(expanded.sidebar.projectExpansion).toEqual({ a: false, b: true });
  });
});

describe('archive and alias', () => {
  it('toggles archived state without duplicates', () => {
    const archived = setProjectArchived(setProjectArchived(workspace(), 'a', true), 'a', true);
    expect(archived.sidebar.archivedProjectCwds).toEqual(['e', 'a']);
    expect(setProjectArchived(archived, 'e', false).sidebar.archivedProjectCwds).toEqual(['a']);
  });

  it('sets and clears an alias', () => {
    const aliased = setProjectAlias(workspace(), 'C:\\Users\\evan', 'home');
    expect(aliased.sidebar.projectAliases).toEqual({ 'C:\\Users\\evan': 'home' });
    expect(setProjectAlias(aliased, 'C:\\Users\\evan', undefined).sidebar.projectAliases).toEqual({});
  });
});
