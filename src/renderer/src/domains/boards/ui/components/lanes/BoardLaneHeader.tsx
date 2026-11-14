import { useState, type CSSProperties, type DragEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { confirmDestructiveAction } from '@renderer/app/stores/confirmationStore';
import { useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { TRUNCATED_TOOLTIP_PROPS } from '@renderer/app/tooltips';
import { contextMenuOpeningOf, type ContextMenuOpening } from '@renderer/shared/ui/components/ActionContextMenu';
import { ActivityIndicator } from '@renderer/shared/ui/components/ActivityIndicator';
import { CollapseToggleButton } from '@renderer/shared/ui/components/CollapseToggleButton';
import { applyDragGhost } from '@renderer/shared/utils/dragGhost';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { LANE_DRAG_MIME } from '../../../model/boardDragTypes';
import type { Lane } from '../../../model/lanes';
import { BoardTileMoveMenu } from '../grid/BoardTileMoveMenu';

interface BoardLaneHeaderProps {
  boardId: string;
  lane: Lane;
  name: string;
  accentColor: string;
  isDropTarget?: boolean;
  onToggleCollapsed?(): void;
  onStartSession(): void;
  onDragOver?(event: DragEvent<HTMLElement>): void;
  onDrop?(event: DragEvent<HTMLElement>): void;
  onDragLeave?(): void;
}

export function BoardLaneHeader({ boardId, lane, name, accentColor, isDropTarget = false, onToggleCollapsed, onStartSession, onDragOver, onDrop, onDragLeave }: BoardLaneHeaderProps) {
  const editor = useBoardsEditor();
  const isDimmed = useBoardSelectionStore((state) => state.focusedTileId !== undefined && !lane.tiles.some((tile) => tile.id === state.focusedTileId));
  const [moveMenu, setMoveMenu] = useState<ContextMenuOpening>();
  const activities = useSessionActivityStore(useShallow((state) => lane.tiles.map((tile) => state.byTileId[tile.id]?.state)));
  const isCollapsed = onToggleCollapsed !== undefined && lane.isCollapsed;

  const activityDots = activities.map((activity, index) => (activity ? <ActivityIndicator key={index} state={activity} /> : null));

  const handleDragStart = (event: DragEvent<HTMLElement>): void => {
    event.dataTransfer.setData(LANE_DRAG_MIME, lane.key);
    event.dataTransfer.effectAllowed = 'move';
    applyDragGhost(event, name, accentColor);
  };

  const confirmClose = async (): Promise<void> => {
    const isConfirmed =
      lane.tiles.length <= 1 ||
      (await confirmDestructiveAction({
        title: 'Close lane',
        message: `Close the ${name} lane and its ${lane.tiles.length} tiles? Their sessions stop; the conversations stay in the sidebar.`,
        actionLabel: 'Close lane',
      }));
    if (isConfirmed) editor.removeTiles(boardId, lane.tiles.map((tile) => tile.id));
  };

  return (
    <header
      className={`readout lane-titlebar flex text-fg shrink-0 cursor-grab items-center gap-2 border-b px-2 py-1 text-[11px] transition-opacity duration-200 active:cursor-grabbing ${isDimmed ? 'opacity-70' : ''} ${
        isCollapsed ? 'h-full flex-col justify-start border-b-0 px-1 py-2' : ''
      } ${isDropTarget ? 'ring-1 ring-accent/70' : ''}`}
      style={{ '--tile-accent': accentColor, borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)` } as CSSProperties}
      draggable
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onContextMenu={(event) => setMoveMenu(contextMenuOpeningOf(event))}
    >
      {moveMenu && <BoardTileMoveMenu boardId={boardId} tiles={lane.tiles} {...moveMenu} onClose={() => setMoveMenu(undefined)} />}
      {onToggleCollapsed && <CollapseToggleButton isCollapsed={isCollapsed} target={name} collapsesToward="left" onToggle={onToggleCollapsed} />}
      <span className={`truncate text-[12px] ${isCollapsed ? '[writing-mode:vertical-rl]' : 'tile-project-plate'}`} {...TRUNCATED_TOOLTIP_PROPS}>{name}</span>
      {isCollapsed ? (
        <span className="flex flex-col gap-1">{activityDots}</span>
      ) : (
        <span className="divided-readouts ml-auto flex shrink-0 items-center gap-2">
          <span className="flex items-baseline gap-1">
            {activityDots}
            <span className="ml-1 text-edge-strong">{lane.tiles.length}</span>
          </span>
          <span className="flex items-center gap-1">
            <button type="button" className="readout hud-button hud-button-compact text-muted" onClick={onStartSession} data-tooltip="New session in this project" aria-label={`New session in ${name}`}>
              + session
            </button>
            <button
              type="button"
              className="readout hud-button hud-button-compact text-muted"
              onClick={() => editor.addTile(boardId, { kind: 'notes', text: '', cwd: lane.key })}
              data-tooltip="Add notes to this project"
              aria-label={`Add notes to ${name}`}
            >
              + notes
            </button>
            <button type="button" className="hud-glyph text-muted" data-glyph="×" data-tone="neutral" onClick={() => void confirmClose()} aria-label={`Close ${name} lane`}>
              ×
            </button>
          </span>
        </span>
      )}
    </header>
  );
}
