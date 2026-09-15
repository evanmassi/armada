import type { Workspace } from '@shared/workspace/workspaceSchemas';

export interface WorkspaceRepository {
  load(): Promise<Workspace>;
  save(workspace: Workspace): Promise<void>;
}
