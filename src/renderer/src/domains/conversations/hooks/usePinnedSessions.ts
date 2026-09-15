import { useWorkspaceEditor, useWorkspaceQuery } from '@renderer/domains/workspace';
import { togglePinnedSession } from '../model/pinEdits';

export function usePinnedSessions() {
  const { data: workspace } = useWorkspaceQuery();
  const { edit } = useWorkspaceEditor();
  const pinnedSessionIds = workspace?.pinnedSessionIds ?? [];
  return {
    pinnedSessionIds,
    isPinned: (sessionId: string): boolean => pinnedSessionIds.includes(sessionId),
    togglePin: (sessionId: string) => edit((current) => togglePinnedSession(current, sessionId)),
  };
}
