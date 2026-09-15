import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { workspaceSchema, type Workspace } from '@shared/workspace/workspaceSchemas';
import type { WorkspaceRepository } from '@main/domain/repositories/WorkspaceRepository';

const EMPTY_WORKSPACE: Workspace = { boards: [], projectColors: {} };

const isMissingFile = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

export class JsonWorkspaceRepository implements WorkspaceRepository {
  constructor(private filePath: string) {}

  async load(): Promise<Workspace> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (isMissingFile(error)) return EMPTY_WORKSPACE;
      throw error;
    }
    const parsed = workspaceSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error(`Workspace file is invalid and was left untouched: ${this.filePath}`);
    }
    return parsed.data;
  }

  async save(workspace: Workspace): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const stagingPath = `${this.filePath}.tmp`;
    await writeFile(stagingPath, JSON.stringify(workspace, null, 2), 'utf8');
    await rename(stagingPath, this.filePath);
  }
}
