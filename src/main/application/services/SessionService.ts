import type { OpenSessionRequest, TerminalRef } from '@shared/sessions/sessionSchemas';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';

interface SessionServiceDeps {
  conversationRepository: ConversationRepository;
  terminalHost: TerminalHost;
}

const CLAUDE_COMMAND = process.platform === 'win32' ? 'claude.exe' : 'claude';

export class SessionService {
  constructor(private deps: SessionServiceDeps) {}

  async open({ sessionId, cwd, cols, rows }: OpenSessionRequest): Promise<TerminalRef> {
    const isExistingConversation = await this.deps.conversationRepository.hasConversation(sessionId);
    const args = isExistingConversation ? ['--resume', sessionId] : ['--session-id', sessionId];
    const terminalId = this.deps.terminalHost.spawn({ command: CLAUDE_COMMAND, args, cwd, cols, rows });
    return { terminalId };
  }
}
