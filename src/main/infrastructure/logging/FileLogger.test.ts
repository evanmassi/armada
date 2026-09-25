import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileLogger } from './FileLogger';

describe('FileLogger', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'armada-log-'));
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  const readLines = async (path: string): Promise<Record<string, unknown>[]> =>
    (await readFile(path, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));

  it('creates the folder and appends one JSON line per entry with errors serialized', async () => {
    const logPath = join(dir, 'nested', 'armada.log');
    const logger = new FileLogger({ filePath: logPath });
    logger.info('terminal.spawned', { terminalId: 't1', args: ['--resume', 's1'] });
    logger.error('workspace.invalid', { error: new Error('boom') });
    const [first, second] = await readLines(logPath);
    expect(first).toMatchObject({ level: 'info', event: 'terminal.spawned', terminalId: 't1', args: ['--resume', 's1'] });
    expect(second).toMatchObject({ level: 'error', event: 'workspace.invalid', error: { name: 'Error', message: 'boom' } });
    expect(typeof first!['at']).toBe('string');
  });

  it('moves an oversized log aside on startup and starts a fresh one', async () => {
    const logPath = join(dir, 'armada.log');
    await writeFile(logPath, 'x'.repeat(1_000_001), 'utf8');
    new FileLogger({ filePath: logPath }).info('app.started');
    expect((await readFile(`${logPath}.1`, 'utf8')).length).toBe(1_000_001);
    expect(await readLines(logPath)).toHaveLength(1);
  });
});
