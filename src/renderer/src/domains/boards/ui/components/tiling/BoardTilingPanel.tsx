import { useState, type DragEvent } from 'react';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { DragSplitter } from '@renderer/shared/ui/components/DragSplitter';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useElementRegistry } from '../../../hooks/useElementRegistry';
import { useSeamDrag } from '../../../hooks/useSeamDrag';
import { TILE_DRAG_MIME } from '../../../model/boardDragTypes';
import { WEIGHT_STEP } from '../../../model/boardEdits';
import { computeTiling } from '../../../model/tiling';
import { BoardTileFrame, type ArrowDirection } from '../grid/BoardTileFrame';

const KEYBOARD_HINT = 'Arrow keys reorder, shift with left or right resizes.';

const withAdjacentWeights = (weights: number[], firstIndex: number, firstWeight: number, secondWeight: number): number[] =>
  weights.map((weight, index) => (index === firstIndex ? firstWeight : index === firstIndex + 1 ? secondWeight : weight));

interface BoardTilingPanelProps {
  board: Board;
  shouldMountTerminals: boolean;
  onOpenShell(cwd: string, afterTileId: string): void;
}

export function BoardTilingPanel({ board, shouldMountTerminals, onOpenShell }: BoardTilingPanelProps) {
  const editor = useBoardsEditor();
  const tileElements = useElementRegistry<string>();
  const rowElements = useElementRegistry<number>();
  const seam = useSeamDrag();
  const [draftTileWeights, setDraftTileWeights] = useState<Record<string, number>>({});
  const [draftRowWeights, setDraftRowWeights] = useState<number[]>();
  const [dropTargetId, setDropTargetId] = useState<string>();

  const rows = computeTiling(board);
  const rowWeights = draftRowWeights ?? rows.map((row) => row.weight);
  const weightOf = (tile: Tile): number => draftTileWeights[tile.id] ?? tile.weight;

  const endSeam = (): void => {
    seam.end();
    setDraftTileWeights({});
    setDraftRowWeights(undefined);
  };

  const beginTileSeam = (first: Tile, second: Tile): void =>
    seam.begin({
      firstPx: tileElements.elementOf(first.id)?.offsetWidth ?? 1,
      secondPx: tileElements.elementOf(second.id)?.offsetWidth ?? 1,
      totalWeight: weightOf(first) + weightOf(second),
      apply: (firstWeight, secondWeight) => setDraftTileWeights({ [first.id]: firstWeight, [second.id]: secondWeight }),
      commit: (firstWeight, secondWeight) => editor.setTileWeights(board.id, { [first.id]: firstWeight, [second.id]: secondWeight }),
    });

  const beginRowSeam = (rowIndex: number): void =>
    seam.begin({
      firstPx: rowElements.elementOf(rowIndex)?.offsetHeight ?? 1,
      secondPx: rowElements.elementOf(rowIndex + 1)?.offsetHeight ?? 1,
      totalWeight: rowWeights[rowIndex]! + rowWeights[rowIndex + 1]!,
      apply: (firstWeight, secondWeight) => setDraftRowWeights(withAdjacentWeights(rowWeights, rowIndex, firstWeight, secondWeight)),
      commit: (firstWeight, secondWeight) => editor.setRowWeights(board.id, withAdjacentWeights(rowWeights, rowIndex, firstWeight, secondWeight)),
    });

  const handleArrow = (tile: Tile, direction: ArrowDirection, isShift: boolean): void => {
    if (isShift) {
      if (direction === 'left') editor.scaleTileWeight(board.id, tile.id, 1 / WEIGHT_STEP);
      if (direction === 'right') editor.scaleTileWeight(board.id, tile.id, WEIGHT_STEP);
      return;
    }
    editor.moveTile(board.id, tile.id, direction === 'left' || direction === 'up' ? -1 : 1);
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
    if (draggedId && draggedId !== tile.id) editor.swapTiles(board.id, draggedId, tile.id);
  };

  return (
    <div className={`flex h-full flex-col gap-1 p-2 ${seam.isDragging ? 'select-none [&_*]:transition-none' : ''}`}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="contents">
          {rowIndex > 0 && <DragSplitter orientation="horizontal" onDragStart={() => beginRowSeam(rowIndex - 1)} onDragMove={seam.move} onDragEnd={endSeam} />}
          <div
            ref={rowElements.refFor(rowIndex)}
            className="flex min-h-0 gap-1 transition-[flex-grow] duration-200"
            style={{ flexGrow: rowWeights[rowIndex], flexBasis: 0 }}
          >
            {row.tiles.map((tile, tileIndex) => (
              <div key={tile.id} className="contents">
                {tileIndex > 0 && (
                  <DragSplitter
                    orientation="vertical"
                    onDragStart={() => beginTileSeam(row.tiles[tileIndex - 1]!, tile)}
                    onDragMove={seam.move}
                    onDragEnd={endSeam}
                  />
                )}
                <div
                  ref={tileElements.refFor(tile.id)}
                  className={`min-w-0 transition-[flex-grow] duration-200 ${dropTargetId === tile.id ? 'rounded-md ring-2 ring-white/70' : ''}`}
                  style={{ flexGrow: weightOf(tile), flexBasis: 0 }}
                  onDragOver={(event) => handleDragOver(tile, event)}
                  onDragLeave={() => setDropTargetId((current) => (current === tile.id ? undefined : current))}
                  onDrop={(event) => handleDrop(tile, event)}
                >
                  <BoardTileFrame
                    boardId={board.id}
                    tile={tile}
                    shouldMountTerminal={shouldMountTerminals}
                    keyboardHint={KEYBOARD_HINT}
                    onOpenShell={onOpenShell}
                    onArrow={(direction, isShift) => handleArrow(tile, direction, isShift)}
                    onDragStart={(event) => handleDragStart(tile, event)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
