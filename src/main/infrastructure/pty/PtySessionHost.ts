import { randomUUID } from 'node:crypto';
import * as pty from 'node-pty';
import type {
  TerminalExitListener,
  TerminalHost,
  TerminalOutputListener,
  TerminalSpawnOptions,
} from '@main/domain/terminals/TerminalHost';

const NESTED_CLAUDE_MARKERS = ['CLAUDECODE', 'CLAUDE_CODE_CHILD_SESSION'];

function hostEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // PITFALL: claude refuses to launch inside another claude session; Armada started from a Claude terminal inherits these markers.
  for (const marker of NESTED_CLAUDE_MARKERS) delete env[marker];
  return env;
}

export class PtySessionHost implements TerminalHost {
  private terminals = new Map<string, pty.IPty>();
  private outputListeners = new Set<TerminalOutputListener>();
  private exitListeners = new Set<TerminalExitListener>();

  spawn({ command, args, cwd, cols, rows }: TerminalSpawnOptions): string {
    const terminalId = randomUUID();
    const terminal = pty.spawn(command, args, { name: 'xterm-256color', cols, rows, cwd, env: hostEnvironment() });
    terminal.onData((data) => this.outputListeners.forEach((listener) => listener(terminalId, data)));
    terminal.onExit(({ exitCode }) => {
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
