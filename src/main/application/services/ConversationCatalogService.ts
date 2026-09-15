import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';

interface ConversationCatalogServiceDeps {
  conversationRepository: ConversationRepository;
}

const byMostRecent = (a: Conversation, b: Conversation): number => b.lastActiveAt.localeCompare(a.lastActiveAt);

const projectDisplayName = (cwd: string): string => cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;

const byDisplayNameThenPath = (a: Project, b: Project): number =>
  projectDisplayName(a.cwd).localeCompare(projectDisplayName(b.cwd), undefined, { sensitivity: 'base' }) ||
  a.cwd.localeCompare(b.cwd);

export function groupConversationsIntoProjects(conversations: Conversation[]): Project[] {
  const byCwd = new Map<string, Conversation[]>();
  for (const conversation of conversations) {
    const siblings = byCwd.get(conversation.cwd) ?? [];
    siblings.push(conversation);
    byCwd.set(conversation.cwd, siblings);
  }
  return [...byCwd.entries()]
    .map(([cwd, projectConversations]) => ({ cwd, conversations: projectConversations.sort(byMostRecent) }))
    .sort(byDisplayNameThenPath);
}

export class ConversationCatalogService {
  constructor(private deps: ConversationCatalogServiceDeps) {}

  async listProjects(): Promise<Project[]> {
    return groupConversationsIntoProjects(await this.deps.conversationRepository.listConversations());
  }
}
