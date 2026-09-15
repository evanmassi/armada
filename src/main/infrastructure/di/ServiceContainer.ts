import { ConversationCatalogService } from '@main/application/services/ConversationCatalogService';
import { SessionService } from '@main/application/services/SessionService';
import type { BoardRepository } from '@main/domain/repositories/BoardRepository';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';
import { ClaudeProjectsReader } from '@main/infrastructure/claude/ClaudeProjectsReader';
import { getBoardsFilePath, getClaudeProjectsDir } from '@main/infrastructure/paths';
import { JsonBoardRepository } from '@main/infrastructure/persistence/JsonBoardRepository';
import { PtySessionHost } from '@main/infrastructure/pty/PtySessionHost';

export interface ServiceContainer {
  conversationCatalogService: ConversationCatalogService;
  sessionService: SessionService;
  boardRepository: BoardRepository;
  terminalHost: TerminalHost;
}

export function createServiceContainer(): ServiceContainer {
  const conversationRepository = new ClaudeProjectsReader(getClaudeProjectsDir());
  const terminalHost = new PtySessionHost();
  return {
    conversationCatalogService: new ConversationCatalogService({ conversationRepository }),
    sessionService: new SessionService({ conversationRepository, terminalHost }),
    boardRepository: new JsonBoardRepository(getBoardsFilePath()),
    terminalHost,
  };
}
