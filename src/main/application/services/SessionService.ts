import type { OpenSessionRequest, TerminalRef } from '@shared/sessions/sessionSchemas';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';
import { CLAUDE_COMMAND } from '@main/domain/claude/claudeCommand';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';

interface SessionServiceDeps {
  conversationRepository: ConversationRepository;
  terminalHost: TerminalHost;
}

interface Launch {
  command: string;
  args: string[];
}

const SHELL_COMMAND = process.platform === 'win32' ? 'pwsh.exe' : (process.env['SHELL'] ?? 'bash');

export class SessionService {
  constructor(private deps: SessionServiceDeps) {}

  async open(request: OpenSessionRequest): Promise<TerminalRef> {
    const { command, args } = request.kind === 'claude' ? await this.claudeLaunch(request.sessionId) : { command: SHELL_COMMAND, args: [] };
    const terminalId = this.deps.terminalHost.spawn({ command, args, cwd: request.cwd, cols: request.cols, rows: request.rows });
    return { terminalId };
  }

  private async claudeLaunch(sessionId: string): Promise<Launch> {
    const isExistingConversation = await this.deps.conversationRepository.hasConversation(sessionId);
    return { command: CLAUDE_COMMAND, args: isExistingConversation ? ['--resume', sessionId] : ['--session-id', sessionId] };
  }
}
