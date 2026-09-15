import { useState } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import { useProjectColors } from '../../../hooks/useProjectColors';
import { ConversationRow } from './ConversationRow';
import { ProjectColorSelector } from './ProjectColorSelector';

interface ConversationProjectSectionProps {
  project: Project;
  onOpenConversation(conversation: Conversation): void;
  onStartSession(cwd: string): void;
}

const projectDisplayName = (cwd: string): string => cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;

export function ConversationProjectSection({ project, onOpenConversation, onStartSession }: ConversationProjectSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colorOf, setColor } = useProjectColors();
  return (
    <section className="border-b border-edge">
      <header className="flex items-center gap-2 px-2 py-1.5">
        <ProjectColorSelector color={colorOf(project.cwd)} onChange={(color) => setColor(project.cwd, color)} />
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          title={project.cwd}
        >
          <span className="text-muted">{isExpanded ? '▾' : '▸'}</span>
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
      {isExpanded && (
        <div className="flex flex-col pb-1">
          {project.conversations.map((conversation) => (
            <ConversationRow key={conversation.sessionId} conversation={conversation} onOpen={onOpenConversation} />
          ))}
        </div>
      )}
    </section>
  );
}
