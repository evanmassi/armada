import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { workspaceSchema, type Workspace } from '@shared/workspace/workspaceSchemas';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { JsonWorkspaceRepository } from './JsonWorkspaceRepository';

const BOARD_ID = '6f1c2a0e-5b7d-4c3e-9a8f-1d2e3f4a5b6c';

const workspaceWithBoards = (count: number): Workspace =>
  workspaceSchema.parse({
    boards: Array.from({ length: count }, (_, index) => ({ id: BOARD_ID, name: `Board ${index} ${'x'.repeat(200)}`, tiles: [] })),
    projectColors: {},
  });

describe('JsonWorkspaceRepository', () => {
  let dir: string;
  let repository: JsonWorkspaceRepository;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'armada-workspace-'));
    repository = new JsonWorkspaceRepository({ filePath: join(dir, 'workspace.json'), logger: new FileLogger(join(dir, 'armada.log')) });
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns an empty workspace when no file exists', async () => {
    expect(await repository.load()).toEqual({ boards: [], projectColors: {}, pinnedSessionIds: [], preferences: { terminalFontSize: 13 }, sidebar: expect.any(Object) });
  });

  it('keeps the last of overlapping saves intact on disk', async () => {
    const saves = [1, 20, 2, 30, 3].map((count) => repository.save(workspaceWithBoards(count)));
    await Promise.all(saves);
    const onDisk = JSON.parse(await readFile(join(dir, 'workspace.json'), 'utf8'));
    expect(onDisk.boards).toHaveLength(3);
  });

  it('reports a corrupt file as invalid instead of a parse crash', async () => {
    await writeFile(join(dir, 'workspace.json'), '{"boards": [', 'utf8');
    await expect(repository.load()).rejects.toThrow('Workspace file is invalid and was left untouched');
  });
});
