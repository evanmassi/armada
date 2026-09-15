import { useState, type DragEvent } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { ActionMenu } from '@renderer/shared/ui/components/ActionMenu';
import { InlineRenameInput } from '@renderer/shared/ui/components/InlineRenameInput';
import { useProjectColors } from '../../../hooks/useProjectColors';
import { splitArchivedConversations } from '../../../model/conversationSearch';
import { ConversationRow } from './ConversationRow';
import { ProjectColorSelector } from './ProjectColorSelector';

export const PROJECT_DRAG_MIME = 'application/x-armada-project';

interface ConversationProjectSectionProps {
  project: Project;
  displayName: string;
  isArchived: boolean;
  isExpanded: boolean;
  isForcedOpen: boolean;
  activityBySession: Map<string, ActivityState>;
  archivedSessionIds: string[];
  isPinned(sessionId: string): boolean;
  onOpenConversation(conversation: Conversation): void;
  onOpenProjectBoard(project: Project): void;
  onStartSession(cwd: string): void;
  onTogglePin(sessionId: string): void;
  onSetConversationArchived(sessionId: string, isArchived: boolean): void;
  onRename(cwd: string, alias: string | undefined): void;
  onSetArchived(cwd: string, isArchived: boolean): void;
  onToggleExpanded(cwd: string, isExpanded: boolean): void;
  onDropProject(draggedCwd: string, beforeCwd: string): void;
}

export function ConversationProjectSection({
  project,
  displayName,
  isArchived,
  isExpanded,
  isForcedOpen,
  activityBySession,
  archivedSessionIds,
  isPinned,
  onOpenConversation,
  onOpenProjectBoard,
  onStartSession,
  onTogglePin,
  onSetConversationArchived,
  onRename,
  onSetArchived,
  onToggleExpanded,
  onDropProject,
}: ConversationProjectSectionProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isShowingArchived, setIsShowingArchived] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const { colorOf, setColor } = useProjectColors();
  const isOpen = isForcedOpen || isExpanded;
  const { active, archived } = splitArchivedConversations(project, archivedSessionIds);

  const handleDragStart = (event: DragEvent<HTMLElement>): void => {
    event.dataTransfer.setData(PROJECT_DRAG_MIME, project.cwd);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLElement>): void => {
    if (!event.dataTransfer.types.includes(PROJECT_DRAG_MIME)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setIsDropTarget(true);
  };

  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropTarget(false);
    const draggedCwd = event.dataTransfer.getData(PROJECT_DRAG_MIME);
    if (draggedCwd && draggedCwd !== project.cwd) onDropProject(draggedCwd, project.cwd);
  };

  const menuItems = [
    { label: 'Rename', onSelect: () => setIsRenaming(true) },
    { label: isArchived ? 'Restore' : 'Archive', onSelect: () => onSetArchived(project.cwd, !isArchived) },
  ];

  const renderRow = (conversation: Conversation, isConversationArchived: boolean) => (
    <ConversationRow
      key={conversation.sessionId}
      conversation={conversation}
      activity={activityBySession.get(conversation.sessionId)}
      isPinned={isPinned(conversation.sessionId)}
      isArchived={isConversationArchived}
      onOpen={onOpenConversation}
      onTogglePin={onTogglePin}
      onSetArchived={onSetConversationArchived}
    />
  );

  return (
    <section
      className={`border-b border-edge ${isDropTarget ? 'border-t-2 border-t-white/70' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
    >
      <header className="flex cursor-grab items-center gap-1 px-2 py-1 active:cursor-grabbing" draggable onDragStart={handleDragStart}>
        <ProjectColorSelector color={colorOf(project.cwd)} onChange={(color) => setColor(project.cwd, color)} />
        <button
          type="button"
          className="px-1 text-muted hover:text-fg"
          onClick={() => onToggleExpanded(project.cwd, !isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse project' : 'Expand project'}
        >
          {isOpen ? '▾' : '▸'}
        </button>
        {isRenaming ? (
          <InlineRenameInput
            initialValue={displayName}
            label="Project name"
            onCommit={(alias) => {
              onRename(project.cwd, alias);
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-white"
            onClick={() => onOpenProjectBoard(project)}
            onKeyDown={(event) => event.key === 'F2' && setIsRenaming(true)}
            title={`${project.cwd}\nOpen as board. F2 renames.`}
          >
            <span className="truncate font-semibold">{displayName}</span>
            <span className="text-[11px] text-muted">{active.length}</span>
          </button>
        )}
        <button
          type="button"
          className="rounded px-1.5 text-muted hover:bg-edge hover:text-fg"
          onClick={() => onStartSession(project.cwd)}
          title="New session in this project"
          aria-label="New session in this project"
        >
          +
        </button>
        <ActionMenu label={`${displayName} actions`} items={menuItems} />
      </header>
      {isOpen && (
        <div className="flex flex-col pb-1">
          {active.map((conversation) => renderRow(conversation, false))}
          {archived.length > 0 && (
            <button
              type="button"
              className="px-4 py-0.5 text-left text-[11px] text-muted hover:text-fg"
              onClick={() => setIsShowingArchived((value) => !value)}
            >
              {isShowingArchived ? 'hide' : 'show'} {archived.length} archived
            </button>
          )}
          {isShowingArchived && archived.map((conversation) => renderRow(conversation, true))}
        </div>
      )}
    </section>
  );
}
