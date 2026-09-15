import type { DragEvent, KeyboardEvent } from 'react';
import type { Tile } from '@shared/workspace/workspaceSchemas';
import { TerminalSessionTile } from '@renderer/domains/terminal';

export const TILE_DRAG_HANDLE_CLASS = 'tile-drag-handle';

export type ArrowDirection = 'left' | 'right' | 'up' | 'down';

const ARROW_KEYS: Record<string, ArrowDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

interface BoardTileFrameProps {
  tile: Tile;
  title: string;
  accentColor: string;
  shouldMountTerminal: boolean;
  keyboardHint: string;
  onClose(): void;
  onArrow(direction: ArrowDirection, isShift: boolean): void;
  onDragStart?(event: DragEvent<HTMLDivElement>): void;
}

const folderName = (cwd: string): string => cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;

export function BoardTileFrame({
  tile,
  title,
  accentColor,
  shouldMountTerminal,
  keyboardHint,
  onClose,
  onArrow,
  onDragStart,
}: BoardTileFrameProps) {
  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const direction = ARROW_KEYS[event.key];
    if (!direction) return;
    event.preventDefault();
    onArrow(direction, event.shiftKey);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border bg-ink" style={{ borderColor: accentColor }}>
      <div
        className={`${TILE_DRAG_HANDLE_CLASS} flex cursor-move items-center gap-2 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-white/60`}
        style={{ background: `${accentColor}22` }}
        tabIndex={0}
        role="group"
        aria-label={`${title} tile. ${keyboardHint}`}
        draggable={onDragStart !== undefined}
        onDragStart={onDragStart}
        onKeyDown={handleHeaderKeyDown}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accentColor }} />
        <span className="min-w-0 flex-1 truncate" title={tile.cwd}>
          <span className="text-fg">{title}</span>
          <span className="text-muted"> · {folderName(tile.cwd)}</span>
        </span>
        <button type="button" className="px-1 text-muted hover:text-fg" onClick={onClose} aria-label="Close tile">
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {shouldMountTerminal && <TerminalSessionTile sessionId={tile.sessionId} cwd={tile.cwd} />}
      </div>
    </div>
  );
}
