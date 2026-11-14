import { useRef, useState, type DragEvent } from 'react';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { useProjectAccents, useProjectNames } from '@renderer/domains/conversations';
import { DragSplitter } from '@renderer/shared/ui/components/DragSplitter';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useElementRegistry } from '../../../hooks/useElementRegistry';
import { useSeamDrag } from '../../../hooks/useSeamDrag';
import { TILE_DRAG_MIME } from '../../../model/boardDragTypes';
import { WEIGHT_STEP } from '../../../model/boardEdits';
import { flexGrowShares } from '../../../model/flexGrowShares';
import { computeLanes, HELPER_COLUMN_KEY, laneStateOf } from '../../../model/lanes';
import { collapsedTiles, computeTiling, tilingSections } from '../../../model/tiling';
import { BoardTileFrame, type ArrowDirection } from '../grid/BoardTileFrame';
import { BoardLaneHeader } from '../lanes/BoardLaneHeader';
import { BoardStackedTileList } from '../stack/BoardStackedTileList';
import { BoardSideStrip } from '../strip/BoardSideStrip';

const KEYBOARD_HINT = 'Arrow keys reorder, shift with left or right resizes.';
const COLLAPSED_KEYBOARD_HINT = 'Arrow keys reorder the collapsed tiles.';
const HELPER_KEYBOARD_HINT = 'Up and down reorder within the column. Shift with up or down resizes the tile, shift with left or right resizes the column.';

const stepOf = (direction: ArrowDirection): -1 | 1 => (direction === 'left' || direction === 'up' ? -1 : 1);

const withAdjacentWeights = (weights: number[], firstIndex: number, firstWeight: number, secondWeight: number): number[] =>
  weights.map((weight, index) => (index === firstIndex ? firstWeight : index === firstIndex + 1 ? secondWeight : weight));

interface BoardTilingPanelProps {
  board: Board;
  shouldMountTerminals: boolean;
  onOpenShell(cwd: string, afterTileId: string): void;
  onStartSession(cwd: string): void;
}

export function BoardTilingPanel({ board, shouldMountTerminals, onOpenShell, onStartSession }: BoardTilingPanelProps) {
  const editor = useBoardsEditor();
  const nameOf = useProjectNames();
  const accentFor = useProjectAccents();
  const lane = computeLanes(board)[0];
  const accentColor = lane ? accentFor(lane.key) : 'transparent';
  const tileElements = useElementRegistry<string>();
  const rowElements = useElementRegistry<number>();
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const helperColumnRef = useRef<HTMLElement>(null);
  const seam = useSeamDrag();
  const [draftTileWeights, setDraftTileWeights] = useState<Record<string, number>>({});
  const [draftRowWeights, setDraftRowWeights] = useState<number[]>();
  const [draftHelperWeight, setDraftHelperWeight] = useState<number>();
  const [dropTargetId, setDropTargetId] = useState<string>();

  const { mainTiles, helperTiles } = tilingSections(board);
  const helperColumn = laneStateOf(board, HELPER_COLUMN_KEY);
  const hasOpenHelperColumn = helperTiles.length > 0 && !helperColumn.isCollapsed;
  const helperWeight = draftHelperWeight ?? helperColumn.weight;
  const [mainAreaShare, helperColumnShare] = flexGrowShares(hasOpenHelperColumn ? [1, helperWeight] : [1]);
  const rows = computeTiling(board);
  const rowWeights = draftRowWeights ?? rows.map((row) => row.weight);
  const weightOf = (tile: Tile): number => draftTileWeights[tile.id] ?? tile.weight;
  const rowShares = flexGrowShares(rowWeights);
  const tileSharesOf = (tiles: Tile[]): number[] => flexGrowShares(tiles.map(weightOf));

  const endSeam = (): void => {
    seam.end();
    setDraftTileWeights({});
    setDraftRowWeights(undefined);
    setDraftHelperWeight(undefined);
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

  const beginHelperSeam = (): void =>
    seam.begin({
      firstPx: mainAreaRef.current?.offsetWidth ?? 1,
      secondPx: helperColumnRef.current?.offsetWidth ?? 1,
      totalWeight: 1 + helperWeight,
      apply: (mainWeight, columnWeight) => setDraftHelperWeight(columnWeight / mainWeight),
      commit: (mainWeight, columnWeight) => editor.setLaneWeights(board.id, { [HELPER_COLUMN_KEY]: columnWeight / mainWeight }),
    });

  const handleArrow = (tile: Tile, direction: ArrowDirection, isShift: boolean): void => {
    if (isShift) {
      if (direction === 'left') editor.scaleTileWeight(board.id, tile.id, 1 / WEIGHT_STEP);
      if (direction === 'right') editor.scaleTileWeight(board.id, tile.id, WEIGHT_STEP);
      return;
    }
    editor.moveTile(board.id, tile.id, stepOf(direction));
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
    const isMainTile = mainTiles.some((candidate) => candidate.id === draggedId);
    if (draggedId && draggedId !== tile.id && isMainTile) editor.swapTiles(board.id, draggedId, tile.id);
  };

  return (
    <div className={`flex h-full flex-col p-2 ${seam.isDragging ? 'select-none [&_*]:transition-none' : ''}`}>
      <div className="flex min-h-0 flex-1 flex-col border" style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}>
        {lane && <BoardLaneHeader boardId={board.id} lane={lane} name={nameOf(lane.key)} accentColor={accentColor} onStartSession={() => onStartSession(lane.key)} />}
        <div className="flex min-h-0 flex-1 gap-1 p-1">
          <div ref={mainAreaRef} className="flex min-w-0 flex-col gap-1 transition-[flex-grow] duration-200" style={{ flexGrow: mainAreaShare, flexBasis: 0 }}>
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="contents">
                {rowIndex > 0 && <DragSplitter orientation="horizontal" onDragStart={() => beginRowSeam(rowIndex - 1)} onDragMove={seam.move} onDragEnd={endSeam} />}
                <div
                  ref={rowElements.refFor(rowIndex)}
                  className="flex min-h-0 gap-1 transition-[flex-grow] duration-200"
                  style={{ flexGrow: rowShares[rowIndex], flexBasis: 0 }}
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
                        style={{ flexGrow: tileSharesOf(row.tiles)[tileIndex], flexBasis: 0 }}
                        onDragOver={(event) => handleDragOver(tile, event)}
                        onDragLeave={() => setDropTargetId((current) => (current === tile.id ? undefined : current))}
                        onDrop={(event) => handleDrop(tile, event)}
                      >
                        <BoardTileFrame
                          boardId={board.id}
                          tile={tile}
                          shouldMountTerminal={shouldMountTerminals}
                          isCollapsible
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
            {collapsedTiles(board).map((tile) => (
              <div key={tile.id} className="shrink-0">
                <BoardTileFrame
                  boardId={board.id}
                  tile={tile}
                  shouldMountTerminal={shouldMountTerminals}
                  isCollapsible
                  keyboardHint={COLLAPSED_KEYBOARD_HINT}
                  onOpenShell={onOpenShell}
                  onArrow={(direction) => editor.moveTile(board.id, tile.id, stepOf(direction))}
                />
              </div>
            ))}
          </div>
          {helperTiles.length > 0 && (
            <>
              {hasOpenHelperColumn && <DragSplitter orientation="vertical" onDragStart={beginHelperSeam} onDragMove={seam.move} onDragEnd={endSeam} />}
              <BoardSideStrip
                ref={helperColumnRef}
                label="helpers"
                count={helperTiles.length}
                isCollapsed={helperColumn.isCollapsed}
                expandedStyle={{ flexGrow: helperColumnShare, flexBasis: 0 }}
                onToggle={() => editor.toggleLaneCollapsed(board.id, HELPER_COLUMN_KEY)}
              >
                <BoardStackedTileList
                  board={board}
                  tiles={helperTiles}
                  shouldMountTerminals={shouldMountTerminals}
                  keyboardHint={HELPER_KEYBOARD_HINT}
                  onOpenShell={onOpenShell}
                  onResizeSideways={(direction) => editor.scaleLaneWeight(board.id, HELPER_COLUMN_KEY, direction === 'left' ? 1 / WEIGHT_STEP : WEIGHT_STEP)}
                />
              </BoardSideStrip>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
