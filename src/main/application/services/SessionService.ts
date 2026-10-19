import type { OpenSessionRequest, TerminalRef } from '@shared/sessions/sessionSchemas';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';
import { CLAUDE_COMMAND } from '@main/domain/claude/claudeCommand';
import { diagramInstructions } from '@main/domain/claude/diagramInstructions';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';

interface SessionServiceDeps {
  conversationRepository: ConversationRepository;
  terminalHost: TerminalHost;
  prepareDiagramFolder(tileId: string): Promise<string>;
  isClaudeOptionSupported(option: string): Promise<boolean>;
}

interface Launch {
  command: string;
  args: string[];
}

// PITFALL: zsh reads ~/.zprofile, where Homebrew and installers put PATH, only as a login shell, which is how a Mac terminal starts one.
const SHELL_LAUNCH: Launch =
  process.platform === 'win32' ? { command: 'pwsh.exe', args: [] } : { command: process.env['SHELL'] ?? 'bash', args: ['-l'] };

const PROMPT_SNAPSHOT_OPTION = '--system-prompt-snapshot';

export class SessionService {
  constructor(private deps: SessionServiceDeps) {}

  async open(request: OpenSessionRequest): Promise<TerminalRef> {
    const { command, args } =
      request.kind === 'claude' ? await this.claudeLaunch(request.sessionId, request.tileId) : SHELL_LAUNCH;
    const terminalId = this.deps.terminalHost.spawn({ command, args, cwd: request.cwd, cols: request.cols, rows: request.rows });
    return { terminalId };
  }

  private async claudeLaunch(sessionId: string, tileId: string): Promise<Launch> {
    const [isExistingConversation, diagramFolder, hasPromptSnapshot] = await Promise.all([
      this.deps.conversationRepository.hasConversation(sessionId),
      this.deps.prepareDiagramFolder(tileId),
      this.deps.isClaudeOptionSupported(PROMPT_SNAPSHOT_OPTION),
    ]);
    const sessionArgs = isExistingConversation ? ['--resume', sessionId] : ['--session-id', sessionId];
    // PITFALL: Claude Code otherwise resends the prompt recorded on the conversation's first request and drops a changed --append-system-prompt, and one too old to know the option refuses to start.
    const snapshotArgs = hasPromptSnapshot ? [PROMPT_SNAPSHOT_OPTION, 'off'] : [];
    return {
      command: CLAUDE_COMMAND,
      args: [...sessionArgs, ...snapshotArgs, '--append-system-prompt', diagramInstructions(diagramFolder), '--add-dir', diagramFolder],
    };
  }
}
