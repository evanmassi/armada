import type { Board } from '@shared/workspace/workspaceSchemas';
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
  return (
    <div className={`flex h-full ${isActive ? '' : 'hidden'}`}>
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
