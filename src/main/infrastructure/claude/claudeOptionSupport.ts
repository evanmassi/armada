import { execFile } from 'node:child_process';
import { CLAUDE_COMMAND } from '@main/domain/claude/claudeCommand';

const HELP_TIMEOUT_MS = 10_000;

export const isClaudeOptionSupported = (option: string): Promise<boolean> =>
  new Promise((resolve) => {
    execFile(CLAUDE_COMMAND, ['--help'], { timeout: HELP_TIMEOUT_MS, windowsHide: true }, (error, stdout) =>
      resolve(!error && stdout.includes(option)),
    );
  });
