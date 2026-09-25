import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionStatus } from '@shared/sessions/sessionSchemas';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { ClaudeSessionStatusFiles } from './ClaudeSessionStatusFiles';

const TERMINAL_ID = '00000000-0000-4000-8000-000000000001';
const SESSION_ID = '00000000-0000-4000-8000-000000000002';

describe('ClaudeSessionStatusFiles', () => {
  let rootDir: string;
  let statusDir: string;
  let statusFiles: ClaudeSessionStatusFiles;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'armada-status-'));
    statusDir = join(rootDir, 'claude-session-status');
    statusFiles = new ClaudeSessionStatusFiles({ statusDir, logger: new FileLogger({ filePath: join(rootDir, 'armada.log') }) });
  });

  afterEach(async () => {
    statusFiles.stop();
    await rm(rootDir, { recursive: true, force: true });
  });

  it('clears reports left by terminals from an earlier run', async () => {
    await mkdir(statusDir, { recursive: true });
    await writeFile(join(statusDir, `${TERMINAL_ID}.json`), '{}', 'utf8');
    await statusFiles.start();
    expect(await readdir(statusDir)).toEqual([]);
  });

  it('announces a terminal report once it is written', async () => {
    await statusFiles.start();
    const report: SessionStatus = {
      terminalId: TERMINAL_ID,
      sessionId: SESSION_ID,
      modelName: 'Opus 5.5',
      effortLevel: 'xhigh',
      contextWindow: { remainingPercentage: 72, size: 200_000 },
      cwd: 'C:\\dev\\armada',
      reportedAt: 5,
    };
    const announced = new Promise((resolve) => statusFiles.onStatus(resolve));
    await writeFile(join(statusDir, `${TERMINAL_ID}.json`), JSON.stringify(report), 'utf8');
    expect(await announced).toEqual(report);
  });
});
