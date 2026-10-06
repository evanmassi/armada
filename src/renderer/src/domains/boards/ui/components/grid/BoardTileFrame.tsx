import { useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useSessionActivityStore, type ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { DiagramDockPanel } from '@renderer/domains/diagrams';
import { disposeLiveTerminal, TerminalSessionTile } from '@renderer/domains/terminal';
import { ActivityDot } from '@renderer/shared/ui/components/ActivityDot';
import { CollapseToggleButton } from '@renderer/shared/ui/components/CollapseToggleButton';
import { StrokeIconButton, StrokeIconDrawing } from '@renderer/shared/ui/components/StrokeIconButton';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useTilePresentation } from '../../../hooks/useTilePresentation';
import { BoardNotesTile } from '../notes/BoardNotesTile';
import { BoardTileSessionIndicator } from './BoardTileSessionIndicator';

export const TILE_DRAG_HANDLE_CLASS = 'tile-drag-handle';

export type ArrowDirection = 'left' | 'right' | 'up' | 'down';

const STATUS_TONES: Record<ActivityState, string> = { working: 'text-accent', waiting: 'text-alert', approval: 'text-alert', idle: 'text-muted', exited: 'text-muted' };

const ARROW_KEYS: Record<string, ArrowDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

interface BoardTileFrameProps {
  boardId: string;
  tile: Tile;
  shouldMountTerminal: boolean;
  isCollapsible: boolean;
  keyboardHint: string;
  onOpenShell?(cwd: string, afterTileId: string): void;
  onArrow(direction: ArrowDirection, isShift: boolean): void;
  onDragStart?(event: DragEvent<HTMLDivElement>): void;
}

function TileBody({ boardId, tile, shouldMountTerminal }: Pick<BoardTileFrameProps, 'boardId' | 'tile' | 'shouldMountTerminal'>) {
  const editor = useBoardsEditor();
  if (tile.kind === 'notes') return <BoardNotesTile boardId={boardId} tile={tile} />;
  if (!shouldMountTerminal) return null;
  const launch = tile.kind === 'claude' ? { kind: tile.kind, sessionId: tile.sessionId, cwd: tile.cwd } : { kind: tile.kind, cwd: tile.cwd };
  return (
    <TerminalSessionTile
      tileId={tile.id}
      launch={launch}
      onSessionRebound={(sessionId) => editor.rebindClaudeTile(boardId, tile.id, sessionId)}
    />
  );
}

export function BoardTileFrame({ boardId, tile, shouldMountTerminal, isCollapsible, keyboardHint, onOpenShell, onArrow, onDragStart }: BoardTileFrameProps) {
  const isFocused = useBoardSelectionStore((state) => state.focusedTileId === tile.id);
  const isDimmed = useBoardSelectionStore((state) => state.focusedTileId !== undefined && state.focusedTileId !== tile.id);
  const setFocusedTile = useBoardSelectionStore((state) => state.setFocusedTile);
  const activity = useSessionActivityStore((state) => state.byTileId[tile.id]?.state);
  const [launchCount, setLaunchCount] = useState(0);
  const editor = useBoardsEditor();
  const { title, accentColor } = useTilePresentation()(tile);
  const isCollapsed = isCollapsible && tile.isCollapsed;
  const isStatusInTitleRow = tile.kind === 'claude' ? isCollapsed : activity === 'exited';
  const relaunch = (): void => {
    disposeLiveTerminal(tile.id);
    setLaunchCount((count) => count + 1);
  };

  const toggleCollapsed = (): void => {
    if (!isCollapsed) setFocusedTile(undefined);
    editor.toggleTileCollapsed(boardId, tile.id);
  };

  const status = (
    <span
      className={`tile-status readout ml-auto shrink-0 text-[11px] ${activity ? STATUS_TONES[activity] : 'text-muted'}`}
      data-tone={activity === 'waiting' || activity === 'approval' ? 'alert' : undefined}
      title={tile.cwd}
    >
      {activity ?? 'idle'}
    </span>
  );

  const handleHeaderKeyDown =(event: KeyboardEvent<HTMLDivElement>): void => {
    const direction = ARROW_KEYS[event.key];
    if (!direction) return;
    event.preventDefault();
    onArrow(direction, event.shiftKey);
  };

  return (
    <div
      className={`tile-frame relative flex h-full flex-col overflow-hidden bg-tile transition-[opacity,box-shadow,border-color] duration-200 ${isDimmed ? 'opacity-70' : ''} ${isFocused ? 'tile-focused' : ''}`}
      style={{ '--tile-accent': accentColor } as CSSProperties}
    >
      <div
        className={`${TILE_DRAG_HANDLE_CLASS} tile-titlebar relative z-20 flex cursor-move flex-col gap-0.5 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/60 ${isCollapsed ? '' : 'border-b border-edge'}`}
        tabIndex={0}
        role="group"
        aria-label={`${title} tile. ${keyboardHint}`}
        draggable={onDragStart !== undefined}
        onDragStart={onDragStart}
        onKeyDown={handleHeaderKeyDown}
        onMouseDown={() => setFocusedTile(isCollapsed ? undefined : tile.id)}
      >
        <div className="flex items-center gap-2">
          {isCollapsible && <CollapseToggleButton isCollapsed={isCollapsed} target="tile" onToggle={toggleCollapsed} />}
          {tile.kind === 'claude' ? (
            activity ? <ActivityDot state={activity} /> : <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accentColor }} />
          ) : (
            <StrokeIconDrawing icon={tile.kind} className="tile-accent-icon" />
          )}
          <span className="tile-title min-w-0 flex-1 truncate">{title}</span>
          {isStatusInTitleRow && status}
          {activity === 'exited' && (
            <button type="button" className="hud-glyph px-1 text-muted" data-glyph="↻" onClick={relaunch} title="Relaunch" aria-label="Relaunch session">
              ↻
            </button>
          )}
          {tile.kind === 'claude' && onOpenShell && (
            <StrokeIconButton icon="shell" label="Open a shell in this folder" onClick={() => onOpenShell(tile.cwd, tile.id)} />
          )}
          <button type="button" className="hud-glyph px-1 text-muted" data-glyph="×" data-tone="neutral" onClick={() => editor.removeTiles(boardId, [tile.id])} aria-label="Close tile">
            ×
          </button>
        </div>
        {tile.kind === 'claude' && !isCollapsed && (
          <div className="tile-titlebar-readouts flex items-center gap-2">
            <BoardTileSessionIndicator tileId={tile.id} projectCwd={tile.cwd} />
            {status}
          </div>
        )}
      </div>
      <div className={isCollapsed ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <div className="min-h-0 flex-1">
          <TileBody key={launchCount} boardId={boardId} tile={tile} shouldMountTerminal={shouldMountTerminal} />
        </div>
        {tile.kind === 'claude' && (
          <DiagramDockPanel
            tileId={tile.id}
            dock={tile.diagramDock}
            onDockChange={(change) => editor.updateDiagramDock(tile.id, change)}
          />
        )}
      </div>
    </div>
  );
}
