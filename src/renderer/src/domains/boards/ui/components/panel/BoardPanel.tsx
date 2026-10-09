import { useEffect, useRef } from 'react';
import type { Board } from '@shared/workspace/workspaceSchemas';
import { tileFocusMoveOf } from '@renderer/app/keyboardShortcuts';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { boardWideNotes, hasMultipleLanes, lanedTiles } from '../../../model/lanes';
import { BoardGridPanel } from '../grid/BoardGridPanel';
import { BoardLanesPanel } from '../lanes/BoardLanesPanel';
import { BoardNotesStrip } from '../notes/BoardNotesStrip';
import { BoardTilingPanel } from '../tiling/BoardTilingPanel';

interface BoardPanelProps {
  board: Board;
  isActive: boolean;
  shouldMountTerminals: boolean;
  onOpenShell(cwd: string, afterTileId: string): void;
  onStartSession(cwd: string): void;
}

export function BoardPanel({ board, isActive, shouldMountTerminals, onOpenShell, onStartSession }: BoardPanelProps) {
  const notes = board.layoutMode === 'free' ? [] : boardWideNotes(board);
  const hasLanedTiles = lanedTiles(board).length > 0;
  const panelRef = useRef<HTMLDivElement>(null);
  const focusTileBody = useBoardSelectionStore((state) => state.focusTileBody);

  useEffect(() => {
    if (!isActive) return;
    const cycleTiles = (event: KeyboardEvent): void => {
      const move = tileFocusMoveOf(event);
      if (move !== 'next' && move !== 'previous') return;
      event.preventDefault();
      const tileIds = [...(panelRef.current?.querySelectorAll<HTMLElement>('[data-tile-body]') ?? [])]
        .filter((body) => body.checkVisibility())
        .map((body) => body.dataset['tileBody']!);
      if (tileIds.length === 0) return;
      const currentTileId = document.activeElement?.closest<HTMLElement>('[data-tile-id]')?.dataset['tileId'] ?? useBoardSelectionStore.getState().focusedTileId;
      const currentIndex = currentTileId === undefined ? -1 : tileIds.indexOf(currentTileId);
      const step = move === 'next' ? 1 : -1;
      const nextIndex = currentIndex === -1 ? (step === 1 ? 0 : tileIds.length - 1) : (currentIndex + step + tileIds.length) % tileIds.length;
      focusTileBody(tileIds[nextIndex]!);
    };
    document.addEventListener('keydown', cycleTiles);
    return () => document.removeEventListener('keydown', cycleTiles);
  }, [isActive, focusTileBody]);

  return (
    <div ref={panelRef} className={`flex h-full ${isActive ? '' : 'hidden'}`}>
      <div className="min-w-0 flex-1">
        {board.layoutMode === 'free' ? (
          <BoardGridPanel board={board} shouldMountTerminals={shouldMountTerminals} onOpenShell={onOpenShell} />
        ) : !hasLanedTiles ? (
          <p className="readout p-8 text-muted">Pick a conversation on the left, or press + on a project to start a new one.</p>
        ) : hasMultipleLanes(board) ? (
          <BoardLanesPanel board={board} shouldMountTerminals={shouldMountTerminals} onOpenShell={onOpenShell} onStartSession={onStartSession} />
        ) : (
          <BoardTilingPanel board={board} shouldMountTerminals={shouldMountTerminals} onOpenShell={onOpenShell} />
        )}
      </div>
      {notes.length > 0 && <BoardNotesStrip board={board} notes={notes} />}
    </div>
  );
}
