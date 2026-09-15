import { describe, expect, it } from 'vitest';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { moveProject, removeSidebarGroup, setProjectAlias, setProjectArchived, setProjectExpanded, sortSidebarProjects } from './sidebarEdits';

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
});

describe('sortSidebarProjects', () => {
  it('sorts every group and the Other list with the given comparator', () => {
    const { sidebar } = sortSidebarProjects(workspace(), (a, b) => b.localeCompare(a), ['d', 'f']);
    expect(sidebar.groups[0]!.projectCwds).toEqual(['b', 'a']);
    expect(sidebar.projectOrder).toEqual(['f', 'd']);
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
