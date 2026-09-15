import type { DragEvent, KeyboardEvent } from 'react';
import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { useProjectNames } from '@renderer/domains/conversations';
import { TerminalSessionTile } from '@renderer/domains/terminal';
import { ActivityDot } from '@renderer/shared/ui/components/ActivityDot';
import { BoardNotesTile } from '../notes/BoardNotesTile';

export const TILE_DRAG_HANDLE_CLASS = 'tile-drag-handle';

export type ArrowDirection = 'left' | 'right' | 'up' | 'down';

const ARROW_KEYS: Record<string, ArrowDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

interface BoardTileFrameProps {
  boardId: string;
  tile: Tile;
  title: string;
  accentColor: string;
  shouldMountTerminal: boolean;
  keyboardHint: string;
  onClose(): void;
  onOpenShell(): void;
  onArrow(direction: ArrowDirection, isShift: boolean): void;
  onDragStart?(event: DragEvent<HTMLDivElement>): void;
}

function TileBody({ boardId, tile, shouldMountTerminal }: Pick<BoardTileFrameProps, 'boardId' | 'tile' | 'shouldMountTerminal'>) {
  if (tile.kind === 'notes') return <BoardNotesTile boardId={boardId} tile={tile} />;
  if (!shouldMountTerminal) return null;
  const launch = tile.kind === 'claude' ? { kind: tile.kind, sessionId: tile.sessionId, cwd: tile.cwd } : { kind: tile.kind, cwd: tile.cwd };
  return <TerminalSessionTile tileId={tile.id} launch={launch} />;
}

export function BoardTileFrame({
  boardId,
  tile,
  title,
  accentColor,
  shouldMountTerminal,
  keyboardHint,
  onClose,
  onOpenShell,
  onArrow,
  onDragStart,
}: BoardTileFrameProps) {
  const isDimmed = useBoardSelectionStore((state) => state.focusedTileId !== undefined && state.focusedTileId !== tile.id);
  const setFocusedTile = useBoardSelectionStore((state) => state.setFocusedTile);
  const activity = useSessionActivityStore((state) => state.byTileId[tile.id]?.state);
  const nameOf = useProjectNames();

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const direction = ARROW_KEYS[event.key];
    if (!direction) return;
    event.preventDefault();
    onArrow(direction, event.shiftKey);
  };

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-md border bg-ink transition-opacity duration-200 ${isDimmed ? 'opacity-70' : ''}`}
      style={{ borderColor: accentColor }}
    >
      <div
        className={`${TILE_DRAG_HANDLE_CLASS} flex cursor-move items-center gap-2 px-2 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-white/60`}
        style={{ background: `${accentColor}22` }}
        tabIndex={0}
        role="group"
        aria-label={`${title} tile. ${keyboardHint}`}
        draggable={onDragStart !== undefined}
        onDragStart={onDragStart}
        onKeyDown={handleHeaderKeyDown}
        onMouseDown={() => setFocusedTile(tile.id)}
      >
        {activity ? <ActivityDot state={activity} /> : <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accentColor }} />}
        <span className="min-w-0 flex-1 truncate" title={tile.kind === 'notes' ? undefined : tile.cwd}>
          <span className="text-fg">{title}</span>
          {tile.kind !== 'notes' && <span className="text-muted"> · {nameOf(tile.cwd)}</span>}
        </span>
        {tile.kind === 'claude' && (
          <button type="button" className="px-1 font-bold text-muted hover:text-fg" onClick={onOpenShell} title="Open a shell in this folder" aria-label="Open a shell in this folder">
            {'>_'}
          </button>
        )}
        <button type="button" className="px-1 text-muted hover:text-fg" onClick={onClose} aria-label="Close tile">
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <TileBody boardId={boardId} tile={tile} shouldMountTerminal={shouldMountTerminal} />
      </div>
    </div>
  );
}
