import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { workspaceSchema, type Workspace } from '@shared/workspace/workspaceSchemas';
import type { WorkspaceRepository } from '@main/domain/repositories/WorkspaceRepository';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const EMPTY_WORKSPACE: Workspace = workspaceSchema.parse({ boards: [], projectColors: {} });

const isMissingFile = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

interface JsonWorkspaceRepositoryDeps {
  filePath: string;
  logger: FileLogger;
}

export class JsonWorkspaceRepository implements WorkspaceRepository {
  constructor(private deps: JsonWorkspaceRepositoryDeps) {}

  async load(): Promise<Workspace> {
    let raw: string;
    try {
      raw = await readFile(this.deps.filePath, 'utf8');
    } catch (error) {
      if (isMissingFile(error)) return EMPTY_WORKSPACE;
      throw error;
    }
    const parsed = workspaceSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      this.deps.logger.error('workspace.invalid', { filePath: this.deps.filePath, issues: parsed.error.issues });
      throw new Error(`Workspace file is invalid and was left untouched: ${this.deps.filePath}`);
    }
    return parsed.data;
  }

  async save(workspace: Workspace): Promise<void> {
    await mkdir(dirname(this.deps.filePath), { recursive: true });
    const stagingPath = `${this.deps.filePath}.tmp`;
    await writeFile(stagingPath, JSON.stringify(workspace, null, 2), 'utf8');
    await rename(stagingPath, this.deps.filePath);
  }
}
