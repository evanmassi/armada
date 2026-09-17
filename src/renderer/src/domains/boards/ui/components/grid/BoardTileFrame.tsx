import { useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useSessionActivityStore, type ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { useFolderActions } from '@renderer/domains/conversations';
import { disposeLiveTerminal, TerminalSessionTile } from '@renderer/domains/terminal';
import { ActionMenu } from '@renderer/shared/ui/components/ActionMenu';
import { tileCwd } from '../../../model/boardQueries';
import { ActivityDot } from '@renderer/shared/ui/components/ActivityDot';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { BoardNotesTile } from '../notes/BoardNotesTile';

export const TILE_DRAG_HANDLE_CLASS = 'tile-drag-handle';

export type ArrowDirection = 'left' | 'right' | 'up' | 'down';

const PLATE_LABELS: Record<Tile['kind'], string> = { claude: 'idle', shell: 'shell', notes: 'notes' };

const plateLabel = (tile: Tile, activity: ActivityState | undefined): string =>
  activity && (tile.kind === 'claude' || activity === 'exited') ? activity : PLATE_LABELS[tile.kind];

const PLATE_TONES: Record<ActivityState, string> = { working: 'text-accent', waiting: 'text-alert', approval: 'text-alert', idle: '', exited: 'text-muted' };

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
  const isFocused = useBoardSelectionStore((state) => state.focusedTileId === tile.id);
  const isDimmed = useBoardSelectionStore((state) => state.focusedTileId !== undefined && state.focusedTileId !== tile.id);
  const setFocusedTile = useBoardSelectionStore((state) => state.setFocusedTile);
  const activity = useSessionActivityStore((state) => state.byTileId[tile.id]?.state);
  const [launchCount, setLaunchCount] = useState(0);
  const { revealInExplorer, openInEditor } = useFolderActions();
  const cwd = tileCwd(tile);
  const relaunch = (): void => {
    disposeLiveTerminal(tile.id);
    setLaunchCount((count) => count + 1);
  };

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
        className={`${TILE_DRAG_HANDLE_CLASS} tile-titlebar relative z-20 flex cursor-move items-center gap-2 border-b border-edge px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/60`}
        tabIndex={0}
        role="group"
        aria-label={`${title} tile. ${keyboardHint}`}
        draggable={onDragStart !== undefined}
        onDragStart={onDragStart}
        onKeyDown={handleHeaderKeyDown}
        onMouseDown={() => setFocusedTile(tile.id)}
      >
        {activity ? <ActivityDot state={activity} /> : <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accentColor }} />}
        <span className="min-w-0 flex-1 truncate font-ui text-[13px] font-semibold tracking-wide text-fg">{title}</span>
        <span
          className={`tile-project-plate readout shrink-0 text-[11px] transition-colors duration-500 ${activity ? PLATE_TONES[activity] : ''}`}
          style={activity ? undefined : { color: accentColor }}
          title={tile.kind === 'notes' ? undefined : tile.cwd}
        >
          {plateLabel(tile, activity)}
        </span>
        {activity === 'exited' && (
          <button type="button" className="px-1 text-muted hover:text-fg" onClick={relaunch} title="Relaunch" aria-label="Relaunch session">
            ↻
          </button>
        )}
        {tile.kind === 'claude' && (
          <button type="button" className="px-1 font-bold text-muted hover:text-fg" onClick={onOpenShell} title="Open a shell in this folder" aria-label="Open a shell in this folder">
            {'>_'}
          </button>
        )}
        {cwd !== undefined && (
          <ActionMenu
            label={`${title} folder actions`}
            entries={[
              { label: 'Open in', emphasis: 'Explorer', onSelect: () => revealInExplorer(cwd) },
              { label: 'Open in', emphasis: 'VS Code', onSelect: () => openInEditor(cwd) },
            ]}
          />
        )}
        <button type="button" className="px-1 text-muted hover:text-fg" onClick={onClose} aria-label="Close tile">
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <TileBody key={launchCount} boardId={boardId} tile={tile} shouldMountTerminal={shouldMountTerminal} />
      </div>
    </div>
  );
}
