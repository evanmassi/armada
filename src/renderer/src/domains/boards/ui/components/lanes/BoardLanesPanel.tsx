import { useState, type DragEvent } from 'react';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { useProjectAccents, useProjectNames } from '@renderer/domains/conversations';
import { DragSplitter } from '@renderer/shared/ui/components/DragSplitter';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useElementRegistry } from '../../../hooks/useElementRegistry';
import { useSeamDrag } from '../../../hooks/useSeamDrag';
import { LANE_DRAG_MIME, TILE_DRAG_MIME } from '../../../model/boardDragTypes';
import { WEIGHT_STEP } from '../../../model/boardEdits';
import { computeLanes, type Lane } from '../../../model/lanes';
import { BoardTileFrame, type ArrowDirection } from '../grid/BoardTileFrame';
import { BoardLaneHeader } from './BoardLaneHeader';

const KEYBOARD_HINT = 'Up and down reorder within the lane. Shift with up or down resizes the tile, shift with left or right resizes the lane.';

interface BoardLanesPanelProps {
  board: Board;
  shouldMountTerminals: boolean;
  onOpenShell(cwd: string, afterTileId: string): void;
  onStartSession(cwd: string): void;
}

export function BoardLanesPanel({ board, shouldMountTerminals, onOpenShell, onStartSession }: BoardLanesPanelProps) {
  const nameOf = useProjectNames();
  const accentFor = useProjectAccents();
  const editor = useBoardsEditor();
  const seam = useSeamDrag();
  const tileElements = useElementRegistry<string>();
  const laneElements = useElementRegistry<string>();
  const [draftTileWeights, setDraftTileWeights] = useState<Record<string, number>>({});
  const [draftLaneWeights, setDraftLaneWeights] = useState<Record<string, number>>({});
  const [dropTargetTileId, setDropTargetTileId] = useState<string>();
  const [dropTargetLaneKey, setDropTargetLaneKey] = useState<string>();

  const lanes = computeLanes(board);
  const laneName = (lane: Lane): string => nameOf(lane.key);
  const laneAccent = (lane: Lane): string => accentFor(lane.key);
  const tileWeightOf = (tile: Tile): number => draftTileWeights[tile.id] ?? tile.weight;
  const laneWeightOf = (lane: Lane): number => draftLaneWeights[lane.key] ?? lane.weight;

  const endSeam = (): void => {
    seam.end();
    setDraftTileWeights({});
    setDraftLaneWeights({});
  };

  const beginTileSeam = (first: Tile, second: Tile): void =>
    seam.begin({
      firstPx: tileElements.elementOf(first.id)?.offsetHeight ?? 1,
      secondPx: tileElements.elementOf(second.id)?.offsetHeight ?? 1,
      totalWeight: tileWeightOf(first) + tileWeightOf(second),
      apply: (firstWeight, secondWeight) => setDraftTileWeights({ [first.id]: firstWeight, [second.id]: secondWeight }),
      commit: (firstWeight, secondWeight) => editor.setTileWeights(board.id, { [first.id]: firstWeight, [second.id]: secondWeight }),
    });

  const beginLaneSeam = (first: Lane, second: Lane): void =>
    seam.begin({
      firstPx: laneElements.elementOf(first.key)?.offsetWidth ?? 1,
      secondPx: laneElements.elementOf(second.key)?.offsetWidth ?? 1,
      totalWeight: laneWeightOf(first) + laneWeightOf(second),
      apply: (firstWeight, secondWeight) => setDraftLaneWeights({ [first.key]: firstWeight, [second.key]: secondWeight }),
      commit: (firstWeight, secondWeight) => editor.setLaneWeights(board.id, { [first.key]: firstWeight, [second.key]: secondWeight }),
    });

  const handleArrow = (lane: Lane, tile: Tile, direction: ArrowDirection, isShift: boolean): void => {
    if (isShift) {
      if (direction === 'up' || direction === 'down') editor.scaleTileWeight(board.id, tile.id, direction === 'up' ? 1 / WEIGHT_STEP : WEIGHT_STEP);
      else editor.scaleLaneWeight(board.id, lane.key, direction === 'left' ? 1 / WEIGHT_STEP : WEIGHT_STEP);
      return;
    }
    if (direction === 'left' || direction === 'right') return;
    const index = lane.tiles.findIndex((candidate) => candidate.id === tile.id);
    const neighbor = lane.tiles[index + (direction === 'up' ? -1 : 1)];
    if (neighbor) editor.swapTiles(board.id, tile.id, neighbor.id);
  };

  const handleTileDragStart = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    event.dataTransfer.setData(TILE_DRAG_MIME, tile.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTileDragOver = (tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes(TILE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetTileId !== tile.id) setDropTargetTileId(tile.id);
  };

  const handleTileDrop = (lane: Lane, tile: Tile, event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData(TILE_DRAG_MIME);
    setDropTargetTileId(undefined);
    const isSameLane = lane.tiles.some((candidate) => candidate.id === draggedId);
    if (draggedId && draggedId !== tile.id && isSameLane) editor.swapTiles(board.id, draggedId, tile.id);
  };

  const handleLaneDragOver = (lane: Lane, event: DragEvent<HTMLElement>): void => {
    if (!event.dataTransfer.types.includes(LANE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetLaneKey !== lane.key) setDropTargetLaneKey(lane.key);
  };

  const handleLaneDrop = (lane: Lane, event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    const draggedKey = event.dataTransfer.getData(LANE_DRAG_MIME);
    setDropTargetLaneKey(undefined);
    if (!draggedKey || draggedKey === lane.key) return;
    const order = lanes.map((item) => item.key).filter((key) => key !== draggedKey);
    order.splice(order.indexOf(lane.key), 0, draggedKey);
    editor.setLaneOrder(board.id, order);
  };

  return (
    <div className={`flex h-full gap-1 p-2 ${seam.isDragging ? 'select-none [&_*]:transition-none' : ''}`}>
      {lanes.map((lane, laneIndex) => (
        <div key={lane.key} className="contents">
          {laneIndex > 0 && !lane.isCollapsed && !lanes[laneIndex - 1]!.isCollapsed && (
            <DragSplitter orientation="vertical" onDragStart={() => beginLaneSeam(lanes[laneIndex - 1]!, lane)} onDragMove={seam.move} onDragEnd={endSeam} />
          )}
          <div
            ref={laneElements.refFor(lane.key)}
            className={`flex min-w-0 flex-col border transition-[flex-grow] duration-200 ${lane.isCollapsed ? 'w-8 shrink-0' : ''}`}
            style={{
              flexGrow: lane.isCollapsed ? 0 : laneWeightOf(lane),
              flexBasis: lane.isCollapsed ? undefined : 0,
              borderColor: `color-mix(in srgb, ${laneAccent(lane)} 30%, transparent)`,
            }}
          >
            <BoardLaneHeader
              lane={lane}
              name={laneName(lane)}
              accentColor={laneAccent(lane)}
              isDropTarget={dropTargetLaneKey === lane.key}
              onToggleCollapsed={() => editor.toggleLaneCollapsed(board.id, lane.key)}
              onStartSession={() => onStartSession(lane.key)}
              onAddNotes={() => editor.addTile(board.id, { kind: 'notes', text: '', cwd: lane.key })}
              onDragOver={(event) => handleLaneDragOver(lane, event)}
              onDragLeave={() => setDropTargetLaneKey((current) => (current === lane.key ? undefined : current))}
              onDrop={(event) => handleLaneDrop(lane, event)}
            />
            <div className={`flex min-h-0 flex-1 flex-col gap-1 p-1 ${lane.isCollapsed ? 'hidden' : ''}`}>
              {lane.tiles.map((tile, tileIndex) => (
                <div key={tile.id} className="contents">
                  {tileIndex > 0 && (
                    <DragSplitter orientation="horizontal" onDragStart={() => beginTileSeam(lane.tiles[tileIndex - 1]!, tile)} onDragMove={seam.move} onDragEnd={endSeam} />
                  )}
                  <div
                    ref={tileElements.refFor(tile.id)}
                    className={`min-h-0 transition-[flex-grow] duration-200 ${dropTargetTileId === tile.id ? 'ring-2 ring-accent/70' : ''}`}
                    style={{ flexGrow: tileWeightOf(tile), flexBasis: 0 }}
                    onDragOver={(event) => handleTileDragOver(tile, event)}
                    onDragLeave={() => setDropTargetTileId((current) => (current === tile.id ? undefined : current))}
                    onDrop={(event) => handleTileDrop(lane, tile, event)}
                  >
                    <BoardTileFrame
                      boardId={board.id}
                      tile={tile}
                      shouldMountTerminal={shouldMountTerminals}
                      keyboardHint={KEYBOARD_HINT}
                      onOpenShell={onOpenShell}
                      onArrow={(direction, isShift) => handleArrow(lane, tile, direction, isShift)}
                      onDragStart={(event) => handleTileDragStart(tile, event)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
