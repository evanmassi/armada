import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { ClaudeUsageFile } from './ClaudeUsageFile';

describe('ClaudeUsageFile', () => {
  let usageDir: string;
  let filePath: string;
  let usageFile: ClaudeUsageFile;

  beforeEach(async () => {
    usageDir = await mkdtemp(join(tmpdir(), 'armada-usage-'));
    filePath = join(usageDir, 'claude-usage', 'usage.json');
    usageFile = new ClaudeUsageFile({ filePath, logger: new FileLogger({ filePath: join(usageDir, 'armada.log') }) });
  });

  afterEach(async () => {
    usageFile.stop();
    await rm(usageDir, { recursive: true, force: true });
  });

  it('has nothing to read before any status line has reported', async () => {
    await usageFile.start();
    expect(usageFile.read()).toBeUndefined();
  });

  it('serves the last report on start and announces a newer one', async () => {
    await usageFile.start();
    usageFile.stop();
    const earlier = { fiveHour: { usedPercentage: 42, resetsAt: 1789687022 }, reportedAt: 1 };
    await writeFile(filePath, JSON.stringify(earlier), 'utf8');
    await usageFile.start();
    expect(usageFile.read()).toEqual(earlier);

    const later = { fiveHour: { usedPercentage: 43, resetsAt: 1789687022 }, sevenDay: { usedPercentage: 18 }, reportedAt: 2 };
    const announced = new Promise((resolve) => usageFile.onChange(resolve));
    await writeFile(filePath, JSON.stringify(later), 'utf8');
    expect(await announced).toEqual(later);
  });

  it('rejects a malformed report', async () => {
    await usageFile.start();
    usageFile.stop();
    await writeFile(filePath, JSON.stringify({ fiveHour: { usedPercentage: 'lots' }, reportedAt: 3 }), 'utf8');
    await usageFile.start();
    expect(usageFile.read()).toBeUndefined();
  });
});
