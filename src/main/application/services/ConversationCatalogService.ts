import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';

interface ConversationCatalogServiceDeps {
  conversationRepository: ConversationRepository;
}

const byMostRecent = (a: { lastActiveAt: string }, b: { lastActiveAt: string }): number =>
  b.lastActiveAt.localeCompare(a.lastActiveAt);

export function groupConversationsIntoProjects(conversations: Conversation[]): Project[] {
  const byCwd = new Map<string, Conversation[]>();
  for (const conversation of conversations) {
    const siblings = byCwd.get(conversation.cwd) ?? [];
    siblings.push(conversation);
    byCwd.set(conversation.cwd, siblings);
  }
  return [...byCwd.entries()]
    .map(([cwd, projectConversations]) => ({ cwd, conversations: projectConversations.sort(byMostRecent) }))
    .sort((a, b) => byMostRecent(a.conversations[0]!, b.conversations[0]!));
}

export class ConversationCatalogService {
  constructor(private deps: ConversationCatalogServiceDeps) {}

  async listProjects(): Promise<Project[]> {
    return groupConversationsIntoProjects(await this.deps.conversationRepository.listConversations());
  }
}
