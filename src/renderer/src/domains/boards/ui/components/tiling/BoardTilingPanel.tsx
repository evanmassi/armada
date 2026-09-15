import { useRef, useState, type DragEvent } from 'react';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useTilePresentation } from '../../../hooks/useTilePresentation';
import { computeTiling } from '../../../model/tiling';
import { BoardTileFrame, type ArrowDirection } from '../grid/BoardTileFrame';
import { BoardSplitter } from './BoardSplitter';

const KEYBOARD_HINT = 'Arrow keys reorder, shift with left or right resizes.';
const MIN_SHARE = 0.15;
const WEIGHT_STEP = 1.15;
const DRAG_MIME = 'application/x-armada-tile';

interface BoardTilingPanelProps {
  board: Board;
  shouldMountTerminals: boolean;
  onOpenShell(cwd: string, afterTileId: string): void;
}

interface SeamDrag {
  firstPx: number;
  secondPx: number;
  totalWeight: number;
  apply(firstWeight: number, secondWeight: number): void;
  commit(): void;
}

const clampShare = (share: number): number => Math.min(1 - MIN_SHARE, Math.max(MIN_SHARE, share));

export function BoardTilingPanel({ board, shouldMountTerminals, onOpenShell }: BoardTilingPanelProps) {
  const presentationOf = useTilePresentation();
  const editor = useBoardsEditor();
  const tileElements = useRef(new Map<string, HTMLDivElement>());
  const rowElements = useRef(new Map<number, HTMLDivElement>());
  const seamDrag = useRef<SeamDrag | undefined>(undefined);
  const [draftTileWeights, setDraftTileWeights] = useState<Record<string, number>>({});
  const [draftRowWeights, setDraftRowWeights] = useState<number[]>();
  const [isDraggingSeam, setIsDraggingSeam] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string>();

  const rows = computeTiling(board);
  const rowWeights = draftRowWeights ?? rows.map((row) => row.weight);
  const weightOf = (tile: Tile): number => draftTileWeights[tile.id] ?? tile.weight;

  const beginSeamDrag = (drag: SeamDrag): void => {
    seamDrag.current = drag;
    setIsDraggingSeam(true);
  };

  const moveSeam = (deltaPx: number): void => {
    const drag = seamDrag.current;
    if (!drag) return;
    const share = clampShare((drag.firstPx + deltaPx) / (drag.firstPx + drag.secondPx));
    drag.apply(share * drag.totalWeight, (1 - share) * drag.totalWeight);
  };

  const endSeamDrag = (): void => {
    seamDrag.current?.commit();
    seamDrag.current = undefined;
    setIsDraggingSeam(false);
    setDraftTileWeights({});
    setDraftRowWeights(undefined);
  };

  const beginTileSeam = (first: Tile, second: Tile): void =>
    beginSeamDrag({
      firstPx: tileElements.current.get(first.id)?.offsetWidth ?? 1,
      secondPx: tileElements.current.get(second.id)?.offsetWidth ?? 1,
      totalWeight: weightOf(first) + weightOf(second),
      apply: (firstWeight, secondWeight) => setDraftTileWeights({ [first.id]: firstWeight, [second.id]: secondWeight }),
      commit: () =>
        setDraftTileWeights((weights) => {
          if (Object.keys(weights).length > 0) editor.setTileWeights(board.id, weights);
          return {};
        }),
    });

  const beginRowSeam = (rowIndex: number): void =>
    beginSeamDrag({
      firstPx: rowElements.current.get(rowIndex)?.offsetHeight ?? 1,
      secondPx: rowElements.current.get(rowIndex + 1)?.offsetHeight ?? 1,
      totalWeight: rowWeights[rowIndex]! + rowWeights[rowIndex + 1]!,
      apply: (firstWeight, secondWeight) =>
        setDraftRowWeights(rowWeights.map((weight, index) => (index === rowIndex ? firstWeight : index === rowIndex + 1 ? secondWeight : weight))),
      commit: () =>
        setDraftRowWeights((weights) => {
          if (weights) editor.setRowWeights(board.id, weights);
          return undefined;
        }),
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
    event.dataTransfer.setData(DRAG_MIME, tile.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetId !== tile.id) setDropTargetId(tile.id);
  };

  const handleDrop = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData(DRAG_MIME);
    setDropTargetId(undefined);
    if (draggedId && draggedId !== tile.id) editor.swapTiles(board.id, draggedId, tile.id);
  };

  return (
    <div className={`flex h-full flex-col gap-1 p-2 ${isDraggingSeam ? 'select-none [&_*]:transition-none' : ''}`}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="contents">
          {rowIndex > 0 && (
            <BoardSplitter orientation="horizontal" onDragStart={() => beginRowSeam(rowIndex - 1)} onDragMove={moveSeam} onDragEnd={endSeamDrag} />
          )}
          <div
            ref={(element) => {
              if (element) rowElements.current.set(rowIndex, element);
              else rowElements.current.delete(rowIndex);
            }}
            className="flex min-h-0 gap-1 transition-[flex-grow] duration-200"
            style={{ flexGrow: rowWeights[rowIndex], flexBasis: 0 }}
          >
            {row.tiles.map((tile, tileIndex) => (
              <div key={tile.id} className="contents">
                {tileIndex > 0 && (
                  <BoardSplitter
                    orientation="vertical"
                    onDragStart={() => beginTileSeam(row.tiles[tileIndex - 1]!, tile)}
                    onDragMove={moveSeam}
                    onDragEnd={endSeamDrag}
                  />
                )}
                <div
                  ref={(element) => {
                    if (element) tileElements.current.set(tile.id, element);
                    else tileElements.current.delete(tile.id);
                  }}
                  className={`min-w-0 transition-[flex-grow] duration-200 ${dropTargetId === tile.id ? 'rounded-md ring-2 ring-white/70' : ''}`}
                  style={{ flexGrow: weightOf(tile), flexBasis: 0 }}
                  onDragOver={(event) => handleDragOver(tile, event)}
                  onDragLeave={() => setDropTargetId((current) => (current === tile.id ? undefined : current))}
                  onDrop={(event) => handleDrop(tile, event)}
                >
                  <BoardTileFrame
                    boardId={board.id}
                    tile={tile}
                    {...presentationOf(tile)}
                    shouldMountTerminal={shouldMountTerminals}
                    keyboardHint={KEYBOARD_HINT}
                    onClose={() => editor.removeTile(board.id, tile.id)}
                    onOpenShell={() => tile.kind !== 'notes' && onOpenShell(tile.cwd, tile.id)}
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
