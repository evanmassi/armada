import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  diagramRefSchema,
  type DiagramFormat,
  type DiagramRef,
  type DiagramSummary,
  type TileDiagramsChangedEvent,
} from '@shared/diagrams/diagramSchemas';
import type { WorkspaceRepository } from '@main/domain/repositories/WorkspaceRepository';
import { isMissingPath } from '@main/infrastructure/fileErrors';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_DIAGRAM_BYTES = 4 * 1024 * 1024;
const CHANGE_SETTLE_MS = 120;

type TileDiagramsListener = (event: TileDiagramsChangedEvent) => void;

interface TileDiagramFilesDeps {
  diagramsDir: string;
  workspaceRepository: WorkspaceRepository;
  logger: FileLogger;
}

const FORMATS_BY_EXTENSION: Record<string, DiagramFormat> = { '.mmd': 'mermaid', '.svg': 'svg', '.html': 'html' };

export const diagramFormatOf = (fileName: string): DiagramFormat => FORMATS_BY_EXTENSION[extname(fileName).toLowerCase()] ?? 'svg';

const isDiagramRef = (tileId: string, fileName: string): boolean => diagramRefSchema.safeParse({ tileId, fileName }).success;

const unlessMissing = (error: unknown): undefined => {
  if (isMissingPath(error)) return undefined;
  throw error;
};

export class TileDiagramFiles {
  private listeners = new Set<TileDiagramsListener>();
  private watcher: FSWatcher | undefined;
  private settleTimers = new Map<string, NodeJS.Timeout>();

  constructor(private deps: TileDiagramFilesDeps) {}

  async prepareFolder(tileId: string): Promise<string> {
    const folder = this.folderOf(tileId);
    await mkdir(folder, { recursive: true });
    return folder;
  }

  async start(): Promise<void> {
    await mkdir(this.deps.diagramsDir, { recursive: true });
    await this.prune().catch((error: unknown) => this.deps.logger.error('diagrams.pruneFailed', { error }));
    this.watcher = watch(this.deps.diagramsDir, { recursive: true }, (_change, changedPath) => {
      const [tileId, fileName] = changedPath?.split(/[\\/]/) ?? [];
      if (tileId && fileName && isDiagramRef(tileId, fileName)) this.scheduleRefresh(tileId);
    });
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.settleTimers.forEach((timer) => clearTimeout(timer));
    this.settleTimers.clear();
  }

  onChanged(listener: TileDiagramsListener): void {
    this.listeners.add(listener);
  }

  async list(tileId: string): Promise<DiagramSummary[]> {
    const folder = this.folderOf(tileId);
    const fileNames = (await readdir(folder).catch(unlessMissing)) ?? [];
    const summaries = await Promise.all(
      fileNames
        .filter((fileName) => isDiagramRef(tileId, fileName))
        .map(async (fileName): Promise<DiagramSummary | undefined> => {
          const stats = await stat(join(folder, fileName)).catch(unlessMissing);
          return stats && { fileName, format: diagramFormatOf(fileName), updatedAt: stats.mtimeMs };
        }),
    );
    return summaries.filter((summary) => summary !== undefined).sort((a, b) => a.updatedAt - b.updatedAt);
  }

  async read({ tileId, fileName }: DiagramRef): Promise<string> {
    const path = join(this.folderOf(tileId), fileName);
    const stats = await stat(path).catch((error: unknown) => this.readFailure(path, fileName, error));
    if (stats.size > MAX_DIAGRAM_BYTES) throw new Error(`${fileName} is too large to show as a diagram.`);
    return readFile(path, 'utf8').catch((error: unknown) => this.readFailure(path, fileName, error));
  }

  async saveCopy(filePath: string, content: string): Promise<void> {
    try {
      await writeFile(filePath, content, 'utf8');
    } catch (error) {
      this.deps.logger.error('diagrams.saveFailed', { filePath, error });
      throw new Error(`Could not save the diagram to ${filePath}. Check that the folder exists and is writable.`);
    }
  }

  private folderOf(tileId: string): string {
    return join(this.deps.diagramsDir, tileId);
  }

  private readFailure(path: string, fileName: string, error: unknown): never {
    if (isMissingPath(error)) throw new Error(`${fileName} no longer exists.`);
    this.deps.logger.error('diagrams.readFailed', { path, error });
    throw new Error(`Could not read ${fileName}.`);
  }

  private scheduleRefresh(tileId: string): void {
    clearTimeout(this.settleTimers.get(tileId));
    this.settleTimers.set(
      tileId,
      setTimeout(() => {
        this.settleTimers.delete(tileId);
        this.list(tileId).then(
          (diagrams) => this.listeners.forEach((listener) => listener({ tileId, diagrams })),
          (error: unknown) => this.deps.logger.error('diagrams.listFailed', { tileId, error }),
        );
      }, CHANGE_SETTLE_MS),
    );
  }

  private async prune(): Promise<void> {
    const tileIds = await this.deps.workspaceRepository.load().then(
      (workspace) => new Set(workspace.boards.flatMap((board) => board.tiles.map((tile) => tile.id))),
      (error: unknown) => {
        this.deps.logger.error('diagrams.pruneSkipped', { error });
        return undefined;
      },
    );
    if (!tileIds) return;
    const cutoff = Date.now() - RETENTION_MS;
    const remove = (path: string): Promise<void> =>
      rm(path, { recursive: true, force: true }).catch((error: unknown) => this.deps.logger.error('diagrams.pruneFailed', { path, error }));
    for (const entry of await readdir(this.deps.diagramsDir, { withFileTypes: true })) {
      const folder = join(this.deps.diagramsDir, entry.name);
      if (!entry.isDirectory() || !tileIds.has(entry.name)) {
        await remove(folder);
        continue;
      }
      for (const fileName of await readdir(folder).catch(() => [])) {
        const path = join(folder, fileName);
        const stats = await stat(path).catch(() => undefined);
        if (stats && stats.mtimeMs < cutoff) await remove(path);
      }
    }
  }
}
