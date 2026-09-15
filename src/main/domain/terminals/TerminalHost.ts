export interface TerminalSpawnOptions {
  command: string;
  args: string[];
  cwd: string;
  cols: number;
  rows: number;
}

export type TerminalOutputListener = (terminalId: string, data: string) => void;
export type TerminalExitListener = (terminalId: string, exitCode: number) => void;

export interface TerminalHost {
  spawn(options: TerminalSpawnOptions): string;
  write(terminalId: string, data: string): void;
  resize(terminalId: string, cols: number, rows: number): void;
  kill(terminalId: string): void;
  killAll(): void;
  onOutput(listener: TerminalOutputListener): void;
  onExit(listener: TerminalExitListener): void;
}
