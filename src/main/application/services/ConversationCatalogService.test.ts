import { describe, expect, it } from 'vitest';
import { groupConversationsIntoProjects } from './ConversationCatalogService';

const conversation = (sessionId: string, cwd: string, lastActiveAt: string) => ({
  sessionId,
  cwd,
  title: sessionId,
  lastActiveAt,
});

describe('groupConversationsIntoProjects', () => {
  it('groups by cwd, orders projects by folder name, and conversations by most recent activity', () => {
    const projects = groupConversationsIntoProjects([
      conversation('a', 'C:\\dev\\zeta', '2026-01-01T00:00:00.000Z'),
      conversation('b', 'C:\\dev\\Alpha', '2026-03-01T00:00:00.000Z'),
      conversation('c', 'C:\\dev\\zeta', '2026-02-01T00:00:00.000Z'),
      conversation('d', 'C:\\dev\\beta', '2026-03-01T00:00:00.000Z'),
    ]);

    expect(projects.map((project) => project.cwd)).toEqual(['C:\\dev\\Alpha', 'C:\\dev\\beta', 'C:\\dev\\zeta']);
    expect(projects[2]!.conversations.map((item) => item.sessionId)).toEqual(['c', 'a']);
  });

  it('breaks folder-name ties by full path', () => {
    const projects = groupConversationsIntoProjects([
      conversation('a', 'C:\\work\\app', '2026-01-01T00:00:00.000Z'),
      conversation('b', 'C:\\dev\\app', '2026-01-01T00:00:00.000Z'),
    ]);
    expect(projects.map((project) => project.cwd)).toEqual(['C:\\dev\\app', 'C:\\work\\app']);
  });

  it('returns no projects for no conversations', () => {
    expect(groupConversationsIntoProjects([])).toEqual([]);
  });
});
