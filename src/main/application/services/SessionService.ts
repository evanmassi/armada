import type { OpenSessionRequest, TerminalRef } from '@shared/sessions/sessionSchemas';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';
import { CLAUDE_COMMAND } from '@main/domain/claude/claudeCommand';
import { diagramInstructions } from '@main/domain/claude/diagramInstructions';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';

interface SessionServiceDeps {
  conversationRepository: ConversationRepository;
  terminalHost: TerminalHost;
  prepareDiagramFolder(tileId: string): Promise<string>;
}

interface Launch {
  command: string;
  args: string[];
}

// PITFALL: zsh reads ~/.zprofile, where Homebrew and installers put PATH, only as a login shell, which is how a Mac terminal starts one.
const SHELL_LAUNCH: Launch =
  process.platform === 'win32' ? { command: 'pwsh.exe', args: [] } : { command: process.env['SHELL'] ?? 'bash', args: ['-l'] };

export class SessionService {
  constructor(private deps: SessionServiceDeps) {}

  async open(request: OpenSessionRequest): Promise<TerminalRef> {
    const { command, args } =
      request.kind === 'claude' ? await this.claudeLaunch(request.sessionId, request.tileId) : SHELL_LAUNCH;
    const terminalId = this.deps.terminalHost.spawn({ command, args, cwd: request.cwd, cols: request.cols, rows: request.rows });
    return { terminalId };
  }

  private async claudeLaunch(sessionId: string, tileId: string): Promise<Launch> {
    const isExistingConversation = await this.deps.conversationRepository.hasConversation(sessionId);
    const diagramFolder = await this.deps.prepareDiagramFolder(tileId);
    const sessionArgs = isExistingConversation ? ['--resume', sessionId] : ['--session-id', sessionId];
    return {
      command: CLAUDE_COMMAND,
      args: [...sessionArgs, '--append-system-prompt', diagramInstructions(diagramFolder), '--add-dir', diagramFolder],
    };
  }
}
