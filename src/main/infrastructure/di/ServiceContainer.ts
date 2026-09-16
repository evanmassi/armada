import { ConversationCatalogService } from '@main/application/services/ConversationCatalogService';
import { SessionService } from '@main/application/services/SessionService';
import type { WorkspaceRepository } from '@main/domain/repositories/WorkspaceRepository';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';
import { ClaudeProjectsReader } from '@main/infrastructure/claude/ClaudeProjectsReader';
import { ClaudeSessionInbox } from '@main/infrastructure/claude/ClaudeSessionInbox';
import { getClaudeProjectsDir, getClaudeSessionInboxDir, getWorkspaceFilePath } from '@main/infrastructure/paths';
import { JsonWorkspaceRepository } from '@main/infrastructure/persistence/JsonWorkspaceRepository';
import { PtySessionHost } from '@main/infrastructure/pty/PtySessionHost';

export interface ServiceContainer {
  conversationCatalogService: ConversationCatalogService;
  sessionService: SessionService;
  workspaceRepository: WorkspaceRepository;
  terminalHost: TerminalHost;
  claudeSessionInbox: ClaudeSessionInbox;
}

export function createServiceContainer(): ServiceContainer {
  const conversationRepository = new ClaudeProjectsReader(getClaudeProjectsDir());
  const sessionInboxDir = getClaudeSessionInboxDir();
  const terminalHost = new PtySessionHost(sessionInboxDir);
  return {
    conversationCatalogService: new ConversationCatalogService({ conversationRepository }),
    sessionService: new SessionService({ conversationRepository, terminalHost }),
    workspaceRepository: new JsonWorkspaceRepository(getWorkspaceFilePath()),
    terminalHost,
    claudeSessionInbox: new ClaudeSessionInbox(sessionInboxDir),
  };
}
