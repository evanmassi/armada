import { randomUUID } from 'node:crypto';
import * as pty from 'node-pty';
import type {
  TerminalExitListener,
  TerminalHost,
  TerminalOutputListener,
  TerminalSpawnOptions,
} from '@main/domain/terminals/TerminalHost';
import { assertLaunchable } from '@main/infrastructure/launchChecks';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const INHERITED_LAUNCHER_NOISE = ['CLAUDECODE', 'CLAUDE_CODE_CHILD_SESSION', 'NO_COLOR', 'FORCE_COLOR', 'CI'];
// PITFALL: Claude Code only emits embedded hyperlinks for terminals it recognizes, and Armada is not one; FORCE_HYPERLINK opts in.
const TERMINAL_CAPABILITIES = { TERM: 'xterm-256color', COLORTERM: 'truecolor', FORCE_HYPERLINK: '1' };
const ARMADA_TERMINAL_ID_ENV = 'ARMADA_TERMINAL_ID';
const ARMADA_HOOK_INBOX_ENV = 'ARMADA_HOOK_INBOX';
const ARMADA_USAGE_FILE_ENV = 'ARMADA_USAGE_FILE';

interface PtySessionHostDeps {
  hookInboxDir: string;
  usageFilePath: string;
  logger: FileLogger;
}

function hostEnvironment(terminalId: string, { hookInboxDir, usageFilePath }: PtySessionHostDeps): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // PITFALL: a launcher's environment leaks into every tile: nested-claude markers block launch, NO_COLOR strips colors.
  for (const name of INHERITED_LAUNCHER_NOISE) delete env[name];
  return {
    ...env,
    ...TERMINAL_CAPABILITIES,
    [ARMADA_TERMINAL_ID_ENV]: terminalId,
    [ARMADA_HOOK_INBOX_ENV]: hookInboxDir,
    [ARMADA_USAGE_FILE_ENV]: usageFilePath,
  };
}

export class PtySessionHost implements TerminalHost {
  private terminals = new Map<string, pty.IPty>();
  private outputListeners = new Set<TerminalOutputListener>();
  private exitListeners = new Set<TerminalExitListener>();

  constructor(private deps: PtySessionHostDeps) {}

  spawn({ command, args, cwd, cols, rows }: TerminalSpawnOptions): string {
    const terminalId = randomUUID();
    const env = hostEnvironment(terminalId, this.deps);
    let terminal: pty.IPty;
    try {
      assertLaunchable(command, cwd);
      terminal = pty.spawn(command, args, { name: 'xterm-256color', cols, rows, cwd, env });
    } catch (error) {
      this.deps.logger.error('terminal.spawnFailed', { terminalId, command, args, cwd, error });
      throw error;
    }
    this.deps.logger.info('terminal.spawned', { terminalId, command, args, cwd, pid: terminal.pid });
    terminal.onData((data) => this.outputListeners.forEach((listener) => listener(terminalId, data)));
    terminal.onExit(({ exitCode }) => {
      this.deps.logger.info('terminal.exited', { terminalId, exitCode });
      this.terminals.delete(terminalId);
      this.exitListeners.forEach((listener) => listener(terminalId, exitCode));
    });
    this.terminals.set(terminalId, terminal);
    return terminalId;
  }

  write(terminalId: string, data: string): void {
    this.terminals.get(terminalId)?.write(data);
  }

  resize(terminalId: string, cols: number, rows: number): void {
    this.terminals.get(terminalId)?.resize(cols, rows);
  }

  kill(terminalId: string): void {
    this.terminals.get(terminalId)?.kill();
    this.terminals.delete(terminalId);
  }

  killAll(): void {
    for (const terminalId of [...this.terminals.keys()]) this.kill(terminalId);
  }

  onOutput(listener: TerminalOutputListener): void {
    this.outputListeners.add(listener);
  }

  onExit(listener: TerminalExitListener): void {
    this.exitListeners.add(listener);
  }
}
