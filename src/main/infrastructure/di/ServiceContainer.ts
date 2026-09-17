import { ConversationCatalogService } from '@main/application/services/ConversationCatalogService';
import { SessionService } from '@main/application/services/SessionService';
import type { WorkspaceRepository } from '@main/domain/repositories/WorkspaceRepository';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';
import { ClaudeProjectsReader } from '@main/infrastructure/claude/ClaudeProjectsReader';
import { ClaudeHookInbox } from '@main/infrastructure/claude/ClaudeHookInbox';
import { FolderOpener } from '@main/infrastructure/folders/FolderOpener';
import { LinkOpener } from '@main/infrastructure/links/LinkOpener';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { getClaudeProjectsDir, getClaudeHookInboxDir, getLogFilePath, getWorkspaceFilePath } from '@main/infrastructure/paths';
import { JsonWorkspaceRepository } from '@main/infrastructure/persistence/JsonWorkspaceRepository';
import { PtySessionHost } from '@main/infrastructure/pty/PtySessionHost';

export interface ServiceContainer {
  conversationCatalogService: ConversationCatalogService;
  sessionService: SessionService;
  workspaceRepository: WorkspaceRepository;
  terminalHost: TerminalHost;
  claudeHookInbox: ClaudeHookInbox;
  folderOpener: FolderOpener;
  linkOpener: LinkOpener;
  logger: FileLogger;
}

export function createServiceContainer(): ServiceContainer {
  const logger = new FileLogger(getLogFilePath());
  const conversationRepository = new ClaudeProjectsReader(getClaudeProjectsDir());
  const hookInboxDir = getClaudeHookInboxDir();
  const terminalHost = new PtySessionHost({ hookInboxDir, logger });
  const folderOpener = new FolderOpener({ logger });
  return {
    conversationCatalogService: new ConversationCatalogService({ conversationRepository }),
    sessionService: new SessionService({ conversationRepository, terminalHost }),
    workspaceRepository: new JsonWorkspaceRepository({ filePath: getWorkspaceFilePath(), logger }),
    terminalHost,
    claudeHookInbox: new ClaudeHookInbox({ inboxDir: hookInboxDir, logger }),
    folderOpener,
    linkOpener: new LinkOpener({ folderOpener, logger }),
    logger,
  };
}
