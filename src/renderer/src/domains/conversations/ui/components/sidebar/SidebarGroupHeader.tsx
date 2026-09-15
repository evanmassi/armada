import { useState, type DragEvent } from 'react';
import { InlineRenameInput } from '@renderer/shared/ui/components/InlineRenameInput';
import { PROJECT_DRAG_MIME } from './ConversationProjectSection';

interface SidebarGroupHeaderProps {
  name: string;
  projectCount: number;
  isCollapsed: boolean;
  canRename: boolean;
  onToggleCollapsed(): void;
  onRename?(name: string): void;
  onRemove?(): void;
  onDropProject?(draggedCwd: string): void;
}

export function SidebarGroupHeader({ name, projectCount, isCollapsed, canRename, onToggleCollapsed, onRename, onRemove, onDropProject }: SidebarGroupHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLElement>): void => {
    if (!onDropProject || !event.dataTransfer.types.includes(PROJECT_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDropTarget(true);
  };

  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    setIsDropTarget(false);
    const draggedCwd = event.dataTransfer.getData(PROJECT_DRAG_MIME);
    if (draggedCwd) onDropProject?.(draggedCwd);
  };

  const confirmRemove = (): void => {
    if (projectCount === 0 || window.confirm(`Remove group "${name}"? Its ${projectCount} projects move back to Other.`)) onRemove?.();
  };

  return (
    <header
      className={`flex items-center gap-1 bg-ink px-2 py-1 text-[11px] tracking-[0.12em] text-muted uppercase ${isDropTarget ? 'ring-1 ring-white/70' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
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
          className="min-w-0 flex-1 truncate text-left hover:text-fg"
          onDoubleClick={() => canRename && setIsRenaming(true)}
          onKeyDown={(event) => event.key === 'F2' && canRename && setIsRenaming(true)}
          onClick={onToggleCollapsed}
          title={canRename ? 'Double-click or F2 to rename' : undefined}
        >
          {name} <span className="normal-case tracking-normal">{projectCount}</span>
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
