import type { Board } from '@shared/workspace/workspaceSchemas';
import { BoardGridPanel } from '../grid/BoardGridPanel';
import { BoardTilingPanel } from '../tiling/BoardTilingPanel';

interface BoardPanelProps {
  board: Board;
  isActive: boolean;
  shouldMountTerminals: boolean;
}

export function BoardPanel({ board, isActive, shouldMountTerminals }: BoardPanelProps) {
  return (
    <div className={`h-full ${isActive ? '' : 'hidden'}`}>
      {board.tiles.length === 0 ? (
        <p className="p-6 text-muted">Pick a conversation on the left, or press + on a project to start a new one.</p>
      ) : board.layoutMode === 'auto' ? (
        <BoardTilingPanel board={board} shouldMountTerminals={shouldMountTerminals} />
      ) : (
        <BoardGridPanel board={board} shouldMountTerminals={shouldMountTerminals} />
      )}
    </div>
  );
}
