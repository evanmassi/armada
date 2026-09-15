import type { KeyboardEvent } from 'react';
import type { Tile, TileColor, TileLayout } from '@shared/boards/boardSchemas';
import { TerminalSessionTile } from '@renderer/domains/terminal';
import { TILE_COLOR_VALUES } from '../../tileColors';
import { BoardTileColorSelector } from './BoardTileColorSelector';

export const TILE_DRAG_HANDLE_CLASS = 'tile-drag-handle';

interface BoardTileFrameProps {
  tile: Tile;
  title: string;
  shouldMountTerminal: boolean;
  onClose(): void;
  onColorChange(color: TileColor): void;
  onNudge(delta: Partial<TileLayout>): void;
}

const ARROW_DELTAS: Record<string, Partial<TileLayout>> = {
  ArrowLeft: { x: -1 },
  ArrowRight: { x: 1 },
  ArrowUp: { y: -1 },
  ArrowDown: { y: 1 },
};

const SHIFT_ARROW_DELTAS: Record<string, Partial<TileLayout>> = {
  ArrowLeft: { w: -1 },
  ArrowRight: { w: 1 },
  ArrowUp: { h: -1 },
  ArrowDown: { h: 1 },
};

const folderName = (cwd: string): string => cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;

export function BoardTileFrame({ tile, title, shouldMountTerminal, onClose, onColorChange, onNudge }: BoardTileFrameProps) {
  const accent = TILE_COLOR_VALUES[tile.color];

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const delta = (event.shiftKey ? SHIFT_ARROW_DELTAS : ARROW_DELTAS)[event.key];
    if (!delta) return;
    event.preventDefault();
    onNudge(delta);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border bg-ink" style={{ borderColor: accent }}>
      <div
        className={`${TILE_DRAG_HANDLE_CLASS} flex cursor-move items-center gap-2 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-white/60`}
        style={{ background: `${accent}22` }}
        tabIndex={0}
        role="group"
        aria-label={`${title} tile. Arrow keys move, shift and arrow keys resize.`}
        onKeyDown={handleHeaderKeyDown}
      >
        <BoardTileColorSelector color={tile.color} onChange={onColorChange} />
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
