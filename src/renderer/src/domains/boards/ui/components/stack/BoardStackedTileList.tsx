import { useState, type DragEvent } from 'react';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { DragSplitter } from '@renderer/shared/ui/components/DragSplitter';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useElementRegistry } from '../../../hooks/useElementRegistry';
import { useSeamDrag } from '../../../hooks/useSeamDrag';
import { TILE_DRAG_MIME } from '../../../model/boardDragTypes';
import { WEIGHT_STEP } from '../../../model/boardEdits';
import { flexGrowShares } from '../../../model/flexGrowShares';
import { BoardTileFrame, type ArrowDirection } from '../grid/BoardTileFrame';

interface BoardStackedTileListProps {
  board: Board;
  tiles: Tile[];
  shouldMountTerminals: boolean;
  keyboardHint: string;
  onOpenShell(cwd: string, afterTileId: string): void;
  onResizeSideways(direction: 'left' | 'right'): void;
}

export function BoardStackedTileList({ board, tiles, shouldMountTerminals, keyboardHint, onOpenShell, onResizeSideways }: BoardStackedTileListProps) {
  const editor = useBoardsEditor();
  const seam = useSeamDrag();
  const tileElements = useElementRegistry<string>();
  const [draftWeights, setDraftWeights] = useState<Record<string, number>>({});
  const [dropTargetId, setDropTargetId] = useState<string>();

  const weightOf = (tile: Tile): number => draftWeights[tile.id] ?? tile.weight;
  const shares = flexGrowShares(tiles.map((tile) => (tile.isCollapsed ? 0 : weightOf(tile))));

  const endSeam = (): void => {
    seam.end();
    setDraftWeights({});
  };

  const beginSeam = (first: Tile, second: Tile): void =>
    seam.begin({
      firstPx: tileElements.elementOf(first.id)?.offsetHeight ?? 1,
      secondPx: tileElements.elementOf(second.id)?.offsetHeight ?? 1,
      totalWeight: weightOf(first) + weightOf(second),
      apply: (firstWeight, secondWeight) => setDraftWeights({ [first.id]: firstWeight, [second.id]: secondWeight }),
      commit: (firstWeight, secondWeight) => editor.setTileWeights(board.id, { [first.id]: firstWeight, [second.id]: secondWeight }),
    });

  const handleArrow = (tile: Tile, direction: ArrowDirection, isShift: boolean): void => {
    if (direction === 'left' || direction === 'right') {
      if (isShift) onResizeSideways(direction);
      return;
    }
    if (isShift) {
      editor.scaleTileWeight(board.id, tile.id, direction === 'up' ? 1 / WEIGHT_STEP : WEIGHT_STEP);
      return;
    }
    const neighbor = tiles[tiles.findIndex((candidate) => candidate.id === tile.id) + (direction === 'up' ? -1 : 1)];
    if (neighbor) editor.swapTiles(board.id, tile.id, neighbor.id);
  };

  const handleDragStart = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    event.dataTransfer.setData(TILE_DRAG_MIME, tile.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes(TILE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetId !== tile.id) setDropTargetId(tile.id);
  };

  const handleDrop = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData(TILE_DRAG_MIME);
    setDropTargetId(undefined);
    const isInThisList = tiles.some((candidate) => candidate.id === draggedId);
    if (draggedId && draggedId !== tile.id && isInThisList) editor.swapTiles(board.id, draggedId, tile.id);
  };

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-1 p-1 ${seam.isDragging ? 'select-none [&_*]:transition-none' : ''}`}>
      {tiles.map((tile, index) => (
        <div key={tile.id} className="contents">
          {index > 0 && !tile.isCollapsed && !tiles[index - 1]!.isCollapsed && (
            <DragSplitter orientation="horizontal" onDragStart={() => beginSeam(tiles[index - 1]!, tile)} onDragMove={seam.move} onDragEnd={endSeam} />
          )}
          <div
            ref={tileElements.refFor(tile.id)}
            className={`min-h-0 transition-[flex-grow] duration-200 ${tile.isCollapsed ? 'shrink-0' : ''} ${dropTargetId === tile.id ? 'ring-2 ring-accent/70' : ''}`}
            style={tile.isCollapsed ? undefined : { flexGrow: shares[index], flexBasis: 0 }}
            onDragOver={(event) => handleDragOver(tile, event)}
            onDragLeave={() => setDropTargetId((current) => (current === tile.id ? undefined : current))}
            onDrop={(event) => handleDrop(tile, event)}
          >
            <BoardTileFrame
              boardId={board.id}
              tile={tile}
              shouldMountTerminal={shouldMountTerminals}
              isCollapsible
              keyboardHint={keyboardHint}
              onOpenShell={onOpenShell}
              onArrow={(direction, isShift) => handleArrow(tile, direction, isShift)}
              onDragStart={(event) => handleDragStart(tile, event)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
