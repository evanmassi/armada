import type { Conversation, Project } from '@shared/conversations/conversationTypes';

const STALE_AFTER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export const folderName = (cwd: string): string => cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;

const matches = (haystack: string, needle: string): boolean => haystack.toLowerCase().includes(needle);

export function filterProjects(projects: Project[], query: string, nameOf: (cwd: string) => string): Project[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return projects;
  return projects.flatMap((project) => {
    if (matches(nameOf(project.cwd), needle)) return [project];
    const conversations = project.conversations.filter((conversation) => matches(conversation.title, needle));
    return conversations.length > 0 ? [{ ...project, conversations }] : [];
  });
}

export const isRecentlyActive = (project: Project, now: Date): boolean =>
  project.conversations.some((conversation) => now.getTime() - new Date(conversation.lastActiveAt).getTime() < STALE_AFTER_DAYS * DAY_MS);

export const findPinnedConversations = (projects: Project[], pinnedSessionIds: string[]): Conversation[] => {
  const bySessionId = new Map(projects.flatMap((project) => project.conversations.map((conversation) => [conversation.sessionId, conversation])));
  return pinnedSessionIds.flatMap((sessionId) => bySessionId.get(sessionId) ?? []);
};

export const splitArchivedConversations = (project: Project, archivedSessionIds: string[]): { active: Conversation[]; archived: Conversation[] } => ({
  active: project.conversations.filter((conversation) => !archivedSessionIds.includes(conversation.sessionId)),
  archived: project.conversations.filter((conversation) => archivedSessionIds.includes(conversation.sessionId)),
});
