import { describe, expect, it, vi } from 'vitest';
import type { TerminalHost } from '@main/domain/terminals/TerminalHost';
import { SessionService } from './SessionService';

const launchArgs = async (isOptionSupported: boolean): Promise<string[]> => {
  const spawn = vi.fn<TerminalHost['spawn']>(() => 'terminal-1');
  const service = new SessionService({
    conversationRepository: { listConversations: async () => [], hasConversation: async () => true },
    terminalHost: { spawn } as unknown as TerminalHost,
    prepareDiagramFolder: async (tileId) => `diagrams/${tileId}`,
    isClaudeOptionSupported: async () => isOptionSupported,
  });
  await service.open({ kind: 'claude', sessionId: 'session-1', tileId: 'tile-1', cwd: 'C:\\dev\\app', cols: 80, rows: 24 });
  return spawn.mock.calls[0]![0].args;
};

describe('SessionService', () => {
  it('turns off the prompt snapshot so a resumed conversation gets the current instructions', async () => {
    const args = await launchArgs(true);
    expect(args.slice(0, 4)).toEqual(['--resume', 'session-1', '--system-prompt-snapshot', 'off']);
    expect(args).toContain('--append-system-prompt');
  });

  it('leaves the option out for a Claude Code that does not know it', async () => {
    expect(await launchArgs(false)).not.toContain('--system-prompt-snapshot');
  });
});
