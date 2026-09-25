import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import { folderName } from '@shared/projects/folderName';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';

interface ConversationCatalogServiceDeps {
  conversationRepository: ConversationRepository;
}

const byMostRecent = (a: Conversation, b: Conversation): number => b.lastActiveAt.localeCompare(a.lastActiveAt);

const byFolderNameThenPath = (a: Project, b: Project): number =>
  folderName(a.cwd).localeCompare(folderName(b.cwd), undefined, { sensitivity: 'base' }) ||
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
    .sort(byFolderNameThenPath);
}

export class ConversationCatalogService {
  constructor(private deps: ConversationCatalogServiceDeps) {}

  async listProjects(): Promise<Project[]> {
    return groupConversationsIntoProjects(await this.deps.conversationRepository.listConversations());
  }
}
