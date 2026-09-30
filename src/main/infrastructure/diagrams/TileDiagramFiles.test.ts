import { mkdir, mkdtemp, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { workspaceSchema, type Workspace } from '@shared/workspace/workspaceSchemas';
import type { WorkspaceRepository } from '@main/domain/repositories/WorkspaceRepository';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { TileDiagramFiles } from './TileDiagramFiles';

const OPEN_TILE_ID = '00000000-0000-4000-8000-000000000001';
const CLOSED_TILE_ID = '00000000-0000-4000-8000-000000000002';
const FIFTEEN_DAYS_AGO_S = Date.now() / 1000 - 15 * 24 * 60 * 60;

const workspaceWithTile = (tileId: string): Workspace =>
  workspaceSchema.parse({
    boards: [
      {
        id: '00000000-0000-4000-8000-000000000010',
        name: 'Board',
        tiles: [{ id: tileId, kind: 'claude', sessionId: '00000000-0000-4000-8000-000000000020', cwd: 'C:\\dev', layout: { x: 0, y: 0, w: 6, h: 14 } }],
      },
    ],
    projectColors: {},
  });

const repositoryReturning = (load: () => Promise<Workspace>): WorkspaceRepository => ({ load, save: async () => undefined });

describe('TileDiagramFiles', () => {
  let rootDir: string;
  let diagramsDir: string;
  let diagramFiles: TileDiagramFiles;

  const createDiagramFiles = (workspaceRepository: WorkspaceRepository): TileDiagramFiles =>
    new TileDiagramFiles({ diagramsDir, workspaceRepository, logger: new FileLogger({ filePath: join(rootDir, 'armada.log') }) });

  const writeDiagram = async (tileId: string, fileName: string, content = 'flowchart LR\n  a --> b'): Promise<string> => {
    await mkdir(join(diagramsDir, tileId), { recursive: true });
    const path = join(diagramsDir, tileId, fileName);
    await writeFile(path, content, 'utf8');
    return path;
  };

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'armada-diagrams-'));
    diagramsDir = join(rootDir, 'diagrams');
    diagramFiles = createDiagramFiles(repositoryReturning(async () => workspaceWithTile(OPEN_TILE_ID)));
  });

  afterEach(async () => {
    diagramFiles.stop();
    await rm(rootDir, { recursive: true, force: true });
  });

  it('deletes diagrams from closed tiles and ones untouched for 14 days on start', async () => {
    await writeDiagram(CLOSED_TILE_ID, 'gone.mmd');
    const stale = await writeDiagram(OPEN_TILE_ID, 'stale.svg');
    await utimes(stale, FIFTEEN_DAYS_AGO_S, FIFTEEN_DAYS_AGO_S);
    await writeDiagram(OPEN_TILE_ID, 'fresh.mmd');
    await diagramFiles.start();
    expect(await readdir(diagramsDir)).toEqual([OPEN_TILE_ID]);
    expect(await readdir(join(diagramsDir, OPEN_TILE_ID))).toEqual(['fresh.mmd']);
  });

  it('deletes nothing when the workspace cannot be read', async () => {
    diagramFiles = createDiagramFiles(repositoryReturning(() => Promise.reject(new Error('unreadable'))));
    await writeDiagram(CLOSED_TILE_ID, 'kept.mmd');
    await diagramFiles.start();
    expect(await readdir(join(diagramsDir, CLOSED_TILE_ID))).toEqual(['kept.mmd']);
  });

  it('lists only diagram files, oldest change first, with their format', async () => {
    const older = await writeDiagram(OPEN_TILE_ID, 'pathway.svg', '<svg/>');
    await utimes(older, FIFTEEN_DAYS_AGO_S + 60, FIFTEEN_DAYS_AGO_S + 60);
    await writeDiagram(OPEN_TILE_ID, 'kinetics.html', '<p>model</p>');
    await writeDiagram(OPEN_TILE_ID, 'notes.txt', 'not a diagram');
    const diagrams = await diagramFiles.list(OPEN_TILE_ID);
    expect(diagrams.map(({ fileName, format }) => ({ fileName, format }))).toEqual([
      { fileName: 'pathway.svg', format: 'svg' },
      { fileName: 'kinetics.html', format: 'html' },
    ]);
  });

  it('lists nothing for a tile that has not drawn yet', async () => {
    expect(await diagramFiles.list(OPEN_TILE_ID)).toEqual([]);
  });

  it('reads a diagram source', async () => {
    await writeDiagram(OPEN_TILE_ID, 'flow.mmd', 'flowchart TD\n  x --> y');
    expect(await diagramFiles.read({ tileId: OPEN_TILE_ID, fileName: 'flow.mmd' })).toBe('flowchart TD\n  x --> y');
  });
});
