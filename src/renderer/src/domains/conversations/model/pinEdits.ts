import type { Workspace } from '@shared/workspace/workspaceSchemas';

export const togglePinnedSession = (workspace: Workspace, sessionId: string): Workspace => ({
  ...workspace,
  pinnedSessionIds: workspace.pinnedSessionIds.includes(sessionId)
    ? workspace.pinnedSessionIds.filter((pinned) => pinned !== sessionId)
    : [...workspace.pinnedSessionIds, sessionId],
});
