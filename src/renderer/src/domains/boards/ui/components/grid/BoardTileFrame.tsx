import { useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useSessionActivityStore, type ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { TRUNCATED_TOOLTIP_PROPS } from '@renderer/app/tooltips';
import { useFolderActions } from '@renderer/domains/conversations';
import { DiagramDockPanel } from '@renderer/domains/diagrams';
import { disposeLiveTerminal, TerminalSessionTile } from '@renderer/domains/terminal';
import { contextMenuOpeningOf, type ContextMenuOpening } from '@renderer/shared/ui/components/ActionContextMenu';
import { ActivityIndicator } from '@renderer/shared/ui/components/ActivityIndicator';
import { CollapseToggleButton } from '@renderer/shared/ui/components/CollapseToggleButton';
import { StrokeIconButton, StrokeIconDrawing } from '@renderer/shared/ui/components/StrokeIconButton';
import { FILE_MANAGER_NAME } from '@renderer/shared/utils/commandKey';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useTilePresentation } from '../../../hooks/useTilePresentation';
import { BoardNotesTile } from '../notes/BoardNotesTile';
import { BoardTileMoveMenu } from './BoardTileMoveMenu';
import { BoardTileSessionIndicator } from './BoardTileSessionIndicator';

export const TILE_DRAG_HANDLE_CLASS = 'tile-drag-handle';

export type ArrowDirection = 'left' | 'right' | 'up' | 'down';

const STATUS_TONES: Record<ActivityState, string> = { working: 'text-accent', waiting: 'text-fg', approval: 'text-warning', idle: 'text-muted', exited: 'text-muted' };

const STATES_WITH_ICON = new Set<ActivityState>(['working', 'waiting', 'approval']);

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
  const [moveMenu, setMoveMenu] = useState<ContextMenuOpening>();
  const editor = useBoardsEditor();
  const { revealInFileManager, openInEditor } = useFolderActions();
  const { title, accentColor } = useTilePresentation()(tile);
  const { cwd } = tile;
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
      className={`tile-status readout ml-auto inline-flex shrink-0 items-baseline gap-1.5 text-[11px] ${activity ? STATUS_TONES[activity] : 'text-muted'}`}
      data-tone={activity === 'approval' ? 'warning' : undefined}
      data-tooltip={tile.cwd}
    >
      {activity && STATES_WITH_ICON.has(activity) && <ActivityIndicator state={activity} />}
      {activity === 'working' ? (
        <span className="activity-glint" data-text={activity}>
          {activity}
        </span>
      ) : (
        (activity ?? 'idle')
      )}
    </span>
  );

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
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
        className={`${TILE_DRAG_HANDLE_CLASS} tile-titlebar relative z-20 flex cursor-move flex-col gap-0.5 px-2 py-1 text-[11px] ${isCollapsed ? '' : 'border-b border-edge'}`}
        tabIndex={0}
        role="group"
        aria-label={`${title} tile. ${keyboardHint} The menu key moves it to another board.`}
        draggable={onDragStart !== undefined}
        onDragStart={onDragStart}
        onKeyDown={handleHeaderKeyDown}
        onMouseDown={() => setFocusedTile(isCollapsed ? undefined : tile.id)}
        onContextMenu={(event) => setMoveMenu(contextMenuOpeningOf(event))}
      >
        {moveMenu && <BoardTileMoveMenu boardId={boardId} tiles={[tile]} {...moveMenu} onClose={() => setMoveMenu(undefined)} />}
        <div className="flex items-center gap-2">
          {isCollapsible && <CollapseToggleButton isCollapsed={isCollapsed} target="tile" onToggle={toggleCollapsed} />}
          <StrokeIconDrawing icon={tile.kind} className="tile-accent-icon" />
          <span className="tile-title min-w-0 flex-1 truncate" {...TRUNCATED_TOOLTIP_PROPS}>{title}</span>
          {isStatusInTitleRow && status}
          {activity === 'exited' && (
            <button type="button" className="hud-glyph px-1 text-muted" data-glyph="↻" onClick={relaunch} data-tooltip="Relaunch" aria-label="Relaunch session">
              ↻
            </button>
          )}
          {cwd !== undefined && (
            <>
              <StrokeIconButton icon="folder" label={`Open in ${FILE_MANAGER_NAME}`} onClick={() => revealInFileManager(cwd)} />
              <StrokeIconButton icon="editor" label="Open in VS Code" onClick={() => openInEditor(cwd)} />
            </>
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
