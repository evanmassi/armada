import { useState } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { useProjectColors } from '../../../hooks/useProjectColors';
import { projectDisplayName } from '../../../model/conversationSearch';
import { ConversationRow } from './ConversationRow';
import { ProjectColorSelector } from './ProjectColorSelector';

interface ConversationProjectSectionProps {
  project: Project;
  isExpandedByDefault: boolean;
  isForcedOpen: boolean;
  activityBySession: Map<string, ActivityState>;
  isPinned(sessionId: string): boolean;
  onOpenConversation(conversation: Conversation): void;
  onOpenProjectBoard(project: Project): void;
  onStartSession(cwd: string): void;
  onTogglePin(sessionId: string): void;
}

export function ConversationProjectSection({
  project,
  isExpandedByDefault,
  isForcedOpen,
  activityBySession,
  isPinned,
  onOpenConversation,
  onOpenProjectBoard,
  onStartSession,
  onTogglePin,
}: ConversationProjectSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);
  const { colorOf, setColor } = useProjectColors();
  const isOpen = isForcedOpen || isExpanded;
  return (
    <section className="border-b border-edge">
      <header className="flex items-center gap-1 px-2 py-1">
        <ProjectColorSelector color={colorOf(project.cwd)} onChange={(color) => setColor(project.cwd, color)} />
        <button
          type="button"
          className="px-1 text-muted hover:text-fg"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse project' : 'Expand project'}
        >
          {isOpen ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-white"
          onClick={() => onOpenProjectBoard(project)}
          title={`${project.cwd}\nOpen as board`}
        >
          <span className="truncate font-semibold">{projectDisplayName(project.cwd)}</span>
          <span className="text-[11px] text-muted">{project.conversations.length}</span>
        </button>
        <button
          type="button"
          className="rounded px-1.5 text-muted hover:bg-edge hover:text-fg"
          onClick={() => onStartSession(project.cwd)}
          title="New session in this project"
          aria-label="New session in this project"
        >
          +
        </button>
      </header>
      {isOpen && (
        <div className="flex flex-col pb-1">
          {project.conversations.map((conversation) => (
            <ConversationRow
              key={conversation.sessionId}
              conversation={conversation}
              activity={activityBySession.get(conversation.sessionId)}
              isPinned={isPinned(conversation.sessionId)}
              onOpen={onOpenConversation}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      )}
    </section>
  );
}
