import { describe, expect, it } from 'vitest';
import type { Project } from '@shared/conversations/conversationTypes';
import { filterProjects, findPinnedConversations, isRecentlyActive } from './conversationSearch';

const projects: Project[] = [
  {
    cwd: 'C:\\dev\\armada',
    conversations: [
      { sessionId: 'a', cwd: 'C:\\dev\\armada', title: 'Dashboard layout', lastActiveAt: '2026-09-14T00:00:00.000Z' },
      { sessionId: 'b', cwd: 'C:\\dev\\armada', title: 'Shutdown crash', lastActiveAt: '2026-09-01T00:00:00.000Z' },
    ],
  },
  {
    cwd: 'C:\\dev\\blockfall',
    conversations: [{ sessionId: 'c', cwd: 'C:\\dev\\blockfall', title: 'Mobile app not opening', lastActiveAt: '2026-08-01T00:00:00.000Z' }],
  },
];

describe('filterProjects', () => {
  it('returns everything for a blank query', () => {
    expect(filterProjects(projects, '  ')).toBe(projects);
  });

  it('keeps whole projects whose name matches and trims others to matching conversations', () => {
    expect(filterProjects(projects, 'ARMADA').map((project) => project.conversations.length)).toEqual([2]);
    expect(filterProjects(projects, 'crash')[0]!.conversations.map((item) => item.sessionId)).toEqual(['b']);
    expect(filterProjects(projects, 'nothing')).toEqual([]);
  });
});

describe('isRecentlyActive', () => {
  it('is true within fourteen days of the newest conversation', () => {
    const now = new Date('2026-09-15T00:00:00.000Z');
    expect(isRecentlyActive(projects[0]!, now)).toBe(true);
    expect(isRecentlyActive(projects[1]!, now)).toBe(false);
  });
});

describe('findPinnedConversations', () => {
  it('returns pinned conversations in pin order and drops unknown ids', () => {
    expect(findPinnedConversations(projects, ['c', 'zzz', 'a']).map((item) => item.sessionId)).toEqual(['c', 'a']);
  });
});
