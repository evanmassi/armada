import { useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import { CLICK_ORIGIN_PROPS, QUIET_CLICK_PROPS, ROW_ORIGIN_CLICK_PROPS } from '@renderer/app/clickFeedback';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { ActionMenu, type ActionMenuEntry, type ActionMenuItem } from '@renderer/shared/ui/components/ActionMenu';
import { InlineRenameInput } from '@renderer/shared/ui/components/InlineRenameInput';
import { applyDragGhost, placementFromPointer, PLACEMENT_LINE_CLASS, type DropPlacement } from '@renderer/shared/utils/dragGhost';
import { useFolderActions } from '../../../hooks/useFolderActions';
import { useProjectAccents, useProjectColors } from '../../../hooks/useProjectColors';
import { splitArchivedConversations } from '../../../model/conversationSearch';
import { PROJECT_DRAG_MIME } from '../../../model/sidebarDragTypes';
import { selectIsSidebarDragging, useSidebarDragStore } from '../../../stores/sidebarDragStore';
import { ConversationRow } from './ConversationRow';
import { ProjectColorSelector } from './ProjectColorSelector';

interface ConversationProjectSectionProps {
  project: Project;
  displayName: string;
  isArchived: boolean;
  isExpanded: boolean;
  isForcedOpen: boolean;
  hasBoard: boolean;
  activityBySession: Map<string, ActivityState>;
  activeBoardSessionIds: ReadonlySet<string>;
  archivedSessionIds: string[];
  moveTargets: ActionMenuItem[];
  isPinned(sessionId: string): boolean;
  onOpenConversation(conversation: Conversation, keepOnCurrentBoard: boolean): void;
  onOpenProjectBoard(project: Project): void;
  onStartSession(cwd: string, keepOnCurrentBoard: boolean): void;
  onTogglePin(sessionId: string): void;
  onSetConversationArchived(sessionId: string, isArchived: boolean): void;
  onRename(cwd: string, alias: string | undefined): void;
  onSetArchived(cwd: string, isArchived: boolean): void;
  onToggleExpanded(cwd: string, isExpanded: boolean): void;
  onDropProject(draggedCwd: string, placement: DropPlacement): void;
  onNudge(step: -1 | 1): void;
}

export function ConversationProjectSection({
  project,
  displayName,
  isArchived,
  isExpanded,
  isForcedOpen,
  hasBoard,
  activityBySession,
  activeBoardSessionIds,
  archivedSessionIds,
  moveTargets,
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
  onNudge,
}: ConversationProjectSectionProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isShowingArchived, setIsShowingArchived] = useState(false);
  const [dropPlacement, setDropPlacement] = useState<DropPlacement>();
  const { colorOf, setColor } = useProjectColors();
  const accentFor = useProjectAccents();
  const { revealInExplorer, openInEditor } = useFolderActions();
  const isAnyDragging = useSidebarDragStore(selectIsSidebarDragging);
  const isBeingDragged = useSidebarDragStore((state) => state.draggingCwd === project.cwd);
  const { beginProjectDrag, endDrag } = useSidebarDragStore.getState();
  const isOpen = !isAnyDragging && (isForcedOpen || isExpanded);
  const { active, archived } = splitArchivedConversations(project, archivedSessionIds);

  const handleDragStart = (event: DragEvent<HTMLElement>): void => {
    event.dataTransfer.setData(PROJECT_DRAG_MIME, project.cwd);
    event.dataTransfer.effectAllowed = 'move';
    applyDragGhost(event, displayName, accentFor(project.cwd));
    // PITFALL: collapsing or dimming the source inside dragstart makes Chromium cancel the drag; defer one tick.
    window.setTimeout(() => beginProjectDrag(project.cwd));
  };

  const handleDragOver = (event: DragEvent<HTMLElement>): void => {
    if (!event.dataTransfer.types.includes(PROJECT_DRAG_MIME) || isBeingDragged) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    const placement = placementFromPointer(event);
    if (placement !== dropPlacement) setDropPlacement(placement);
  };

  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const placement = dropPlacement ?? placementFromPointer(event);
    setDropPlacement(undefined);
    const draggedCwd = event.dataTransfer.getData(PROJECT_DRAG_MIME);
    if (draggedCwd && draggedCwd !== project.cwd) onDropProject(draggedCwd, placement);
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'F2') setIsRenaming(true);
    if (!event.ctrlKey) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      onNudge(event.key === 'ArrowUp' ? -1 : 1);
    }
  };

  const menuEntries: ActionMenuEntry[] = [
    { label: hasBoard ? 'Go to' : 'Open as', emphasis: 'Board', onSelect: () => onOpenProjectBoard(project) },
    { label: 'Open in', emphasis: 'Explorer', onSelect: () => revealInExplorer(project.cwd) },
    { label: 'Open in', emphasis: 'VS Code', onSelect: () => openInEditor(project.cwd) },
    ...(moveTargets.length > 0 ? ['divider' as const, { label: 'Move to', items: moveTargets }] : []),
    'divider',
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
      isOnActiveBoard={activeBoardSessionIds.has(conversation.sessionId)}
      onOpen={onOpenConversation}
      onTogglePin={onTogglePin}
      onSetArchived={onSetConversationArchived}
    />
  );

  return (
    <section
      className={`border-b border-edge transition-opacity ${dropPlacement ? PLACEMENT_LINE_CLASS[dropPlacement] : ''} ${isBeingDragged ? 'opacity-40' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropPlacement(undefined)}
      onDrop={handleDrop}
    >
      <header
        className="project-header flex cursor-grab items-center gap-1 px-2 py-1 active:cursor-grabbing"
        style={{ '--project-accent': accentFor(project.cwd) } as CSSProperties}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={endDrag}
      >
        <ProjectColorSelector color={colorOf(project.cwd)} onChange={(color) => setColor(project.cwd, color)} />
        <button
          type="button"
          className="hud-glyph px-1 text-muted"
          data-glyph={isOpen ? '▾' : '▸'}
          {...CLICK_ORIGIN_PROPS}
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
            onClick={() => onToggleExpanded(project.cwd, !isOpen)}
            onKeyDown={handleNameKeyDown}
            aria-expanded={isOpen}
            {...ROW_ORIGIN_CLICK_PROPS}
            title={`${project.cwd}\nF2 renames. Ctrl+Up/Down moves.`}
          >
            <span className="truncate font-ui text-[15px] font-semibold tracking-wide">{displayName}</span>
            <span className="shrink-0 text-muted" aria-hidden="true">·</span>
            <span className="readout shrink-0 text-[12px] text-fg">{active.length}</span>
          </button>
        )}
        <button
          type="button"
          className="hud-glyph px-1.5 text-muted"
          data-glyph="+"
          onClick={(event) => onStartSession(project.cwd, event.shiftKey)}
          title="New session in this project"
          aria-label="New session in this project"
        >
          +
        </button>
        <ActionMenu label={`${displayName} actions`} entries={menuEntries} />
      </header>
      {isOpen && (
        <div className="flex flex-col pb-1">
          {active.map((conversation) => renderRow(conversation, false))}
          {archived.length > 0 && (
            <button
              type="button"
              className="px-4 py-0.5 text-left text-[11px] text-muted hover:text-fg"
              onClick={() => setIsShowingArchived((value) => !value)}
              aria-expanded={isShowingArchived}
              {...QUIET_CLICK_PROPS}
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
