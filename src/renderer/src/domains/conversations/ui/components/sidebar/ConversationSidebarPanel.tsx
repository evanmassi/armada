import { useMemo, useRef, useState } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import { selectActivityBySession, useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { usePinnedSessions } from '../../../hooks/usePinnedSessions';
import { useProjectsQuery } from '../../../hooks/useProjectsQuery';
import { filterProjects, findPinnedConversations, isRecentlyActive } from '../../../model/conversationSearch';
import { ConversationProjectSection } from './ConversationProjectSection';
import { ConversationRow } from './ConversationRow';

interface ConversationSidebarPanelProps {
  onOpenConversation(conversation: Conversation): void;
  onOpenProjectBoard(project: Project): void;
  onStartSession(cwd: string): void;
}

export function ConversationSidebarPanel({ onOpenConversation, onOpenProjectBoard, onStartSession }: ConversationSidebarPanelProps) {
  const { data: projects = [], isPending, isError, error } = useProjectsQuery();
  const { pinnedSessionIds, isPinned, togglePin } = usePinnedSessions();
  const byTileId = useSessionActivityStore((state) => state.byTileId);
  const [query, setQuery] = useState('');
  const openedAt = useRef(new Date());

  const activityBySession = useMemo(() => selectActivityBySession(byTileId), [byTileId]);
  const visibleProjects = useMemo(() => filterProjects(projects, query), [projects, query]);
  const pinnedConversations = useMemo(() => findPinnedConversations(projects, pinnedSessionIds), [projects, pinnedSessionIds]);
  const isSearching = query.trim().length > 0;

  const startSessionInPickedFolder = async (): Promise<void> => {
    const cwd = await armadaClient.projects.pickFolder();
    if (cwd) onStartSession(cwd);
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-edge bg-panel">
      <header className="flex items-center justify-between border-b border-edge px-3 py-2">
        <strong className="text-[11px] tracking-[0.12em] text-muted uppercase">Armada</strong>
        <button type="button" className="rounded bg-edge px-2 py-0.5 hover:text-white" onClick={() => void startSessionInPickedFolder()}>
          + folder
        </button>
      </header>
      <input
        type="search"
        className="mx-2 my-2 rounded border border-edge bg-ink px-2 py-1 text-fg placeholder:text-muted focus:border-muted focus:outline-none"
        placeholder="Search conversations"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search conversations"
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending && <p className="px-3 py-2 text-muted">Reading conversations…</p>}
        {isError && <p className="px-3 py-2 text-red-400">{getErrorMessage(error)}</p>}
        {!isSearching && pinnedConversations.length > 0 && (
          <section className="border-b border-edge pb-1">
            <h2 className="px-3 py-1 text-[11px] tracking-[0.12em] text-muted uppercase">Pinned</h2>
            {pinnedConversations.map((conversation) => (
              <ConversationRow
                key={conversation.sessionId}
                conversation={conversation}
                activity={activityBySession.get(conversation.sessionId)}
                isPinned
                onOpen={onOpenConversation}
                onTogglePin={togglePin}
              />
            ))}
          </section>
        )}
        {visibleProjects.map((project) => (
          <ConversationProjectSection
            key={project.cwd}
            project={project}
            isExpandedByDefault={isRecentlyActive(project, openedAt.current)}
            isForcedOpen={isSearching}
            activityBySession={activityBySession}
            isPinned={isPinned}
            onOpenConversation={onOpenConversation}
            onOpenProjectBoard={onOpenProjectBoard}
            onStartSession={onStartSession}
            onTogglePin={togglePin}
          />
        ))}
        {isSearching && visibleProjects.length === 0 && <p className="px-3 py-2 text-muted">No matches.</p>}
      </div>
    </aside>
  );
}
