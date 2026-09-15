import { describe, expect, it } from 'vitest';
import type { Project } from '@shared/conversations/conversationTypes';
import type { Sidebar } from '@shared/workspace/workspaceSchemas';
import { arrangeSidebar } from './sidebarLayout';

const project = (cwd: string, lastActiveAt: string): Project => ({
  cwd,
  conversations: [{ sessionId: cwd, cwd, title: cwd, lastActiveAt }],
});

const projects = [project('a', '2026-01-01'), project('b', '2026-03-01'), project('c', '2026-02-01'), project('d', '2026-04-01')];

const sidebar = (overrides: Partial<Sidebar>): Sidebar => ({
  width: 288,
  groups: [],
  projectOrder: [],
  archivedProjectCwds: [],
  archivedSessionIds: [],
  projectAliases: {},
  ...overrides,
});

const cwdsOf = (sections: ReturnType<typeof arrangeSidebar>) => sections.map((section) => [section.key, section.projects.map((item) => item.cwd)]);

describe('arrangeSidebar', () => {
  it('lists everything under Other by recency when nothing is arranged', () => {
    expect(cwdsOf(arrangeSidebar(projects, sidebar({})))).toEqual([['other', ['d', 'b', 'c', 'a']]]);
  });

  it('places groups first in their own order, manual order next, newcomers by recency, archived last', () => {
    const sections = arrangeSidebar(
      projects,
      sidebar({
        groups: [{ id: 'g1', name: 'Work', projectCwds: ['c', 'missing'], isCollapsed: false }],
        projectOrder: ['a'],
        archivedProjectCwds: ['d'],
      }),
    );
    expect(cwdsOf(sections)).toEqual([
      ['g1', ['c']],
      ['other', ['a', 'b']],
      ['archived', ['d']],
    ]);
  });

  it('keeps an empty group visible so projects can be dropped into it', () => {
    const sections = arrangeSidebar(projects, sidebar({ groups: [{ id: 'g1', name: 'Empty', projectCwds: [], isCollapsed: false }] }));
    expect(sections[0]).toMatchObject({ key: 'g1', projects: [] });
  });
});
