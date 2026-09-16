import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ClaudeHookEvent } from '@shared/sessions/sessionSchemas';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { ClaudeHookInbox } from './ClaudeHookInbox';

const TERMINAL_ID = '6f1c2a0e-5b7d-4c3e-9a8f-1d2e3f4a5b6c';
const SESSION_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e8f7a6b5c4d';

describe('ClaudeHookInbox', () => {
  let inboxDir: string;
  let inbox: ClaudeHookInbox;

  beforeEach(async () => {
    inboxDir = await mkdtemp(join(tmpdir(), 'armada-inbox-'));
    inbox = new ClaudeHookInbox({ inboxDir, logger: new FileLogger(join(inboxDir, 'armada.log')) });
  });

  afterEach(async () => {
    inbox.stop();
    await rm(inboxDir, { recursive: true, force: true });
  });

  const drop = (name: string, body: unknown): Promise<void> => writeFile(join(inboxDir, name), JSON.stringify(body), 'utf8');

  it('delivers pending events in the order they fired and drops malformed ones', async () => {
    await drop(`${TERMINAL_ID}-1700000000002-9.json`, { terminalId: TERMINAL_ID, sessionId: SESSION_ID, kind: 'turnEnded' });
    await drop(`${TERMINAL_ID}-1700000000001-8.json`, { terminalId: TERMINAL_ID, sessionId: SESSION_ID, kind: 'promptSubmitted' });
    await drop(`${TERMINAL_ID}-1700000000000-7.json`, { terminalId: TERMINAL_ID, kind: 'sessionStarted' });
    await drop('notes.txt', {});
    const received: ClaudeHookEvent[] = [];
    inbox.onEvent((event) => received.push(event));
    await inbox.start();
    expect(received.map((event) => event.kind)).toEqual(['promptSubmitted', 'turnEnded']);
  });
});
