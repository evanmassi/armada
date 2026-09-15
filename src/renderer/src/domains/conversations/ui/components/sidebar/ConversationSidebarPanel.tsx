import type { Conversation } from '@shared/conversations/conversationTypes';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { useProjectsQuery } from '../../../hooks/useProjectsQuery';
import { ConversationProjectSection } from './ConversationProjectSection';

interface ConversationSidebarPanelProps {
  onOpenConversation(conversation: Conversation): void;
  onStartSession(cwd: string): void;
}

export function ConversationSidebarPanel({ onOpenConversation, onStartSession }: ConversationSidebarPanelProps) {
  const { data: projects = [], isPending, isError, error } = useProjectsQuery();

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
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending && <p className="px-3 py-2 text-muted">Reading conversations…</p>}
        {isError && <p className="px-3 py-2 text-red-400">{getErrorMessage(error)}</p>}
        {projects.map((project) => (
          <ConversationProjectSection
            key={project.cwd}
            project={project}
            onOpenConversation={onOpenConversation}
            onStartSession={onStartSession}
          />
        ))}
      </div>
    </aside>
  );
}
