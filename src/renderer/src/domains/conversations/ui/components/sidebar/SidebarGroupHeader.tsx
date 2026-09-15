import { useState, type DragEvent } from 'react';
import { useSidebarDragStore } from '@renderer/app/stores/sidebarDragStore';
import { InlineRenameInput } from '@renderer/shared/ui/components/InlineRenameInput';
import { applyDragGhost, placementFromPointer, PLACEMENT_LINE_CLASS, type DropPlacement } from '@renderer/shared/utils/dragGhost';
import { UNCOLORED_ACCENT } from '../../projectColorPalette';
import { PROJECT_DRAG_MIME } from './ConversationProjectSection';

const GROUP_DRAG_MIME = 'application/x-armada-group';

interface SidebarGroupHeaderProps {
  name: string;
  projectCount: number;
  isCollapsed: boolean;
  groupId?: string;
  projectDropLabel?: string;
  onToggleCollapsed(): void;
  onRename?(name: string): void;
  onRemove?(): void;
  onDropProject?(draggedCwd: string): void;
  onDropGroup?(draggedGroupId: string, placement: DropPlacement): void;
}

type HoverState = { kind: 'project' } | { kind: 'group'; placement: DropPlacement } | undefined;

export function SidebarGroupHeader({
  name,
  projectCount,
  isCollapsed,
  groupId,
  projectDropLabel,
  onToggleCollapsed,
  onRename,
  onRemove,
  onDropProject,
  onDropGroup,
}: SidebarGroupHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [hover, setHover] = useState<HoverState>();
  const isBeingDragged = useSidebarDragStore((state) => state.draggingGroupId !== undefined && state.draggingGroupId === groupId);
  const { beginGroupDrag, endDrag } = useSidebarDragStore.getState();
  const canRename = onRename !== undefined;

  const handleDragStart = (event: DragEvent<HTMLElement>): void => {
    if (!groupId) return;
    event.dataTransfer.setData(GROUP_DRAG_MIME, groupId);
    event.dataTransfer.effectAllowed = 'move';
    applyDragGhost(event, name, UNCOLORED_ACCENT);
    // PITFALL: collapsing or dimming the source inside dragstart makes Chromium cancel the drag; defer one tick.
    window.setTimeout(() => beginGroupDrag(groupId));
  };

  const handleDragOver = (event: DragEvent<HTMLElement>): void => {
    const { types } = event.dataTransfer;
    let next: HoverState;
    if (onDropProject && types.includes(PROJECT_DRAG_MIME)) next = { kind: 'project' };
    else if (onDropGroup && !isBeingDragged && types.includes(GROUP_DRAG_MIME)) next = { kind: 'group', placement: placementFromPointer(event) };
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (JSON.stringify(next) !== JSON.stringify(hover)) setHover(next);
  };

  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setHover(undefined);
    const draggedCwd = event.dataTransfer.getData(PROJECT_DRAG_MIME);
    const draggedGroupId = event.dataTransfer.getData(GROUP_DRAG_MIME);
    if (draggedCwd) onDropProject?.(draggedCwd);
    else if (draggedGroupId && draggedGroupId !== groupId) onDropGroup?.(draggedGroupId, placementFromPointer(event));
  };

  const confirmRemove = (): void => {
    if (projectCount === 0 || window.confirm(`Remove group "${name}"? Its ${projectCount} projects move back to Other.`)) onRemove?.();
  };

  const isProjectTarget = hover?.kind === 'project';
  const groupLine = hover?.kind === 'group' ? PLACEMENT_LINE_CLASS[hover.placement] : '';

  return (
    <header
      className={`readout flex items-center gap-1 px-2 py-1.5 transition-colors ${
        isProjectTarget ? 'bg-accent/15 text-accent' : 'text-muted'
      } ${projectDropLabel ? 'surface-hatched' : ''} ${groupId ? 'cursor-grab active:cursor-grabbing' : ''} ${isBeingDragged ? 'opacity-40' : ''} ${groupLine}`}
      draggable={groupId !== undefined}
      onDragStart={handleDragStart}
      onDragEnd={endDrag}
      onDragOver={handleDragOver}
      onDragLeave={() => setHover(undefined)}
      onDrop={handleDrop}
    >
      <button type="button" className="px-1 hover:text-fg" onClick={onToggleCollapsed} aria-expanded={!isCollapsed} aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}>
        {isCollapsed ? '▸' : '▾'}
      </button>
      {isRenaming && onRename ? (
        <InlineRenameInput
          initialValue={name}
          label="Group name"
          onCommit={(next) => {
            onRename(next);
            setIsRenaming(false);
          }}
          onCancel={() => setIsRenaming(false)}
        />
      ) : (
        <button
          type="button"
          className="rule-label min-w-0 flex-1 truncate text-left hover:text-fg"
          onDoubleClick={() => canRename && setIsRenaming(true)}
          onKeyDown={(event) => event.key === 'F2' && canRename && setIsRenaming(true)}
          onClick={onToggleCollapsed}
          title={canRename ? 'Double-click or F2 to rename. Drag to reorder.' : undefined}
        >
          <span>
            {isProjectTarget ? (projectDropLabel ?? `Move to ${name}`) : name}
            {!isProjectTarget && <span className="ml-2 text-edge-strong">{projectCount}</span>}
          </span>
        </button>
      )}
      {onRemove && (
        <button type="button" className="px-1 hover:text-fg" onClick={confirmRemove} aria-label="Remove group">
          ×
        </button>
      )}
    </header>
  );
}
