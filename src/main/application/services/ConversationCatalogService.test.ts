import { describe, expect, it } from 'vitest';
import { groupConversationsIntoProjects } from './ConversationCatalogService';

const conversation = (sessionId: string, cwd: string, lastActiveAt: string) => ({
  sessionId,
  cwd,
  title: sessionId,
  lastActiveAt,
});

describe('groupConversationsIntoProjects', () => {
  it('groups by cwd and orders projects and conversations by most recent activity', () => {
    const projects = groupConversationsIntoProjects([
      conversation('a', 'C:\\dev\\one', '2026-01-01T00:00:00.000Z'),
      conversation('b', 'C:\\dev\\two', '2026-03-01T00:00:00.000Z'),
      conversation('c', 'C:\\dev\\one', '2026-02-01T00:00:00.000Z'),
    ]);

    expect(projects.map((project) => project.cwd)).toEqual(['C:\\dev\\two', 'C:\\dev\\one']);
    expect(projects[1]!.conversations.map((item) => item.sessionId)).toEqual(['c', 'a']);
  });

  it('returns no projects for no conversations', () => {
    expect(groupConversationsIntoProjects([])).toEqual([]);
  });
});
