import { useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { CLICK_ORIGIN_PROPS, ROW_ORIGIN_CLICK_PROPS } from '@renderer/app/clickFeedback';
import { confirmDestructiveAction } from '@renderer/app/stores/confirmationStore';
import { useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { useProjectColors } from '@renderer/domains/conversations';
import { ActivityIndicator } from '@renderer/shared/ui/components/ActivityIndicator';
import { InlineRenameInput } from '@renderer/shared/ui/components/InlineRenameInput';
import { useTileBoardMoves } from '../../../hooks/useTileBoardMoves';
import { LANE_DRAG_MIME, TILE_DRAG_MIME } from '../../../model/boardDragTypes';

const NEW_BOARD_DROP_TARGET = 'new-board';

interface BoardSwitcherBarProps {
  boards: Board[];
  activeBoardId: string | undefined;
  onSelect(boardId: string): void;
  onCreate(): void;
  onRename(boardId: string, name: string): void;
  onRemove(boardId: string): void;
  children?: ReactNode;
}

const isTileDrag = (event: DragEvent<HTMLElement>): boolean =>
  event.dataTransfer.types.includes(TILE_DRAG_MIME) || event.dataTransfer.types.includes(LANE_DRAG_MIME);

const draggedTilesOf = (event: DragEvent<HTMLElement>, board: Board): Tile[] => {
  const tileId = event.dataTransfer.getData(TILE_DRAG_MIME);
  if (tileId) return board.tiles.filter((tile) => tile.id === tileId);
  const laneKey = event.dataTransfer.getData(LANE_DRAG_MIME);
  return laneKey ? board.tiles.filter((tile) => tile.cwd === laneKey) : [];
};

export function BoardSwitcherBar({ boards, activeBoardId, onSelect, onCreate, onRename, onRemove, children }: BoardSwitcherBarProps) {
  const [editingBoardId, setEditingBoardId] = useState<string>();
  const [dropTarget, setDropTarget] = useState<string>();
  const { colorOf } = useProjectColors();
  const { moveToBoard, moveToNewBoard } = useTileBoardMoves();
  const approvalTileIds = useSessionActivityStore(useShallow((state) => Object.keys(state.byTileId).filter((tileId) => state.byTileId[tileId]?.state === 'approval')));
  const activeBoard = boards.find((board) => board.id === activeBoardId);

  const confirmRemove = async (board: Board): Promise<void> => {
    const isConfirmed =
      board.tiles.length === 0 ||
      (await confirmDestructiveAction({
        title: 'Remove board',
        message: `Remove "${board.name}" and its ${board.tiles.length} tiles? Their sessions stop; the conversations stay in the sidebar.`,
        actionLabel: 'Remove',
      }));
    if (isConfirmed) onRemove(board.id);
  };

  const dropZoneProps = (target: string, onTilesDropped: (fromBoard: Board, tiles: Tile[]) => void) => ({
    'data-drop-target': dropTarget === target || undefined,
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!activeBoard || target === activeBoard.id || !isTileDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (dropTarget !== target) setDropTarget(target);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(undefined);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDropTarget(undefined);
      if (activeBoard) onTilesDropped(activeBoard, draggedTilesOf(event, activeBoard));
    },
  });

  return (
    <nav className="flex items-center gap-2 border-b border-edge bg-panel/80 px-3 py-1.5 backdrop-blur" aria-label="Boards">
      {boards.map((board, index) => {
        const isActive = board.id === activeBoardId;
        const projectColor = board.projectCwd ? colorOf(board.projectCwd) : undefined;
        return (
          <div
            key={board.id}
            className="readout hud-tab group -mt-1.5 -mb-[7px] flex items-center self-stretch pb-[2px] text-muted"
            style={projectColor ? ({ '--hud-line': projectColor } as CSSProperties) : undefined}
            {...CLICK_ORIGIN_PROPS}
            {...dropZoneProps(board.id, (fromBoard, tiles) => moveToBoard(fromBoard.id, tiles, board.id))}
          >
            {editingBoardId === board.id ? (
              <span className="py-[5px] pl-[11px] pr-1">
                <InlineRenameInput
                  initialValue={board.name}
                  label="Board name"
                  onCommit={(name) => {
                    onRename(board.id, name);
                    setEditingBoardId(undefined);
                  }}
                  onCancel={() => setEditingBoardId(undefined)}
                />
              </span>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 py-[5px] pl-[11px] pr-1"
                {...ROW_ORIGIN_CLICK_PROPS}
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => setEditingBoardId(board.id)}
                onKeyDown={(event) => event.key === 'F2' && setEditingBoardId(board.id)}
                aria-current={isActive ? 'page' : undefined}
                data-tooltip="Double-click or F2 to rename"
              >
                <span className="text-edge-strong">{String(index + 1).padStart(2, '0')}</span>
                <span>{board.name}</span>
                {board.tiles.some((tile) => approvalTileIds.includes(tile.id)) && <ActivityIndicator state="approval" />}
              </button>
            )}
            <button
              type="button"
              className={`hud-glyph mr-1 text-muted ${isActive ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
              data-glyph="×"
              data-tone="neutral"
              onClick={() => void confirmRemove(board)}
              aria-label={`Remove board ${board.name}`}
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        type="button"
        className="readout hud-button ml-1 text-muted"
        onClick={onCreate}
        aria-label="New board"
        data-tooltip="New board. Drop a tile or lane here to move it to one."
        {...dropZoneProps(NEW_BOARD_DROP_TARGET, (fromBoard, tiles) => moveToNewBoard(fromBoard.id, tiles))}
      >
        + board
      </button>
      {children}
    </nav>
  );
}
