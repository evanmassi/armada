import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { Board } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useProjectAccents, useProjectNames } from '@renderer/domains/conversations';
import { DragSplitter } from '@renderer/shared/ui/components/DragSplitter';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { useElementRegistry } from '../../../hooks/useElementRegistry';
import { useSeamDrag } from '../../../hooks/useSeamDrag';
import { LANE_DRAG_MIME } from '../../../model/boardDragTypes';
import { WEIGHT_STEP } from '../../../model/boardEdits';
import { flexGrowShares } from '../../../model/flexGrowShares';
import { computeLanes, type Lane } from '../../../model/lanes';
import { BoardStackedTileList } from '../stack/BoardStackedTileList';
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
  const laneElements = useElementRegistry<string>();
  const [draftLaneWeights, setDraftLaneWeights] = useState<Record<string, number>>({});
  const [dropTargetLaneKey, setDropTargetLaneKey] = useState<string>();

  const focusedTileId = useBoardSelectionStore((state) => state.focusedTileId);
  const setFocusedTile = useBoardSelectionStore((state) => state.setFocusedTile);
  const lastFocusedTileByLane = useRef<Record<string, string>>({});

  const focusedLaneKey = board.tiles.find((tile) => tile.id === focusedTileId)?.cwd;
  useEffect(() => {
    if (focusedLaneKey !== undefined && focusedTileId !== undefined) lastFocusedTileByLane.current[focusedLaneKey] = focusedTileId;
  }, [focusedLaneKey, focusedTileId]);

  const lanes = computeLanes(board);
  const laneAccent = (lane: Lane): string => accentFor(lane.key);
  const laneWeightOf = (lane: Lane): number => draftLaneWeights[lane.key] ?? lane.weight;
  const laneShares = flexGrowShares(lanes.map((lane) => (lane.isCollapsed ? 0 : laneWeightOf(lane))));

  const endSeam = (): void => {
    seam.end();
    setDraftLaneWeights({});
  };

  const beginLaneSeam = (first: Lane, second: Lane): void =>
    seam.begin({
      firstPx: laneElements.elementOf(first.key)?.offsetWidth ?? 1,
      secondPx: laneElements.elementOf(second.key)?.offsetWidth ?? 1,
      totalWeight: laneWeightOf(first) + laneWeightOf(second),
      apply: (firstWeight, secondWeight) => setDraftLaneWeights({ [first.key]: firstWeight, [second.key]: secondWeight }),
      commit: (firstWeight, secondWeight) => editor.setLaneWeights(board.id, { [first.key]: firstWeight, [second.key]: secondWeight }),
    });

  const focusLane = (lane: Lane): void => {
    // PITFALL: the tile's own press already moved focus earlier in this same event, which only the store's live value has seen yet.
    const currentTileId = useBoardSelectionStore.getState().focusedTileId;
    if (lane.isCollapsed || lane.tiles.some((tile) => tile.id === currentTileId)) return;
    const openTiles = lane.tiles.filter((tile) => !tile.isCollapsed);
    const target = openTiles.find((tile) => tile.id === lastFocusedTileByLane.current[lane.key]) ?? openTiles[0];
    if (target) setFocusedTile(target.id);
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
              flexGrow: laneShares[laneIndex],
              flexBasis: lane.isCollapsed ? undefined : 0,
              borderColor: `color-mix(in srgb, ${laneAccent(lane)} 30%, transparent)`,
            }}
            onPointerDown={() => focusLane(lane)}
          >
            <BoardLaneHeader
              boardId={board.id}
              lane={lane}
              name={nameOf(lane.key)}
              accentColor={laneAccent(lane)}
              isDropTarget={dropTargetLaneKey === lane.key}
              onToggleCollapsed={() => editor.toggleLaneCollapsed(board.id, lane.key)}
              onStartSession={() => onStartSession(lane.key)}
              onDragOver={(event) => handleLaneDragOver(lane, event)}
              onDragLeave={() => setDropTargetLaneKey((current) => (current === lane.key ? undefined : current))}
              onDrop={(event) => handleLaneDrop(lane, event)}
            />
            <div className={lane.isCollapsed ? 'hidden' : 'contents'}>
              <BoardStackedTileList
                board={board}
                tiles={lane.tiles}
                shouldMountTerminals={shouldMountTerminals}
                keyboardHint={KEYBOARD_HINT}
                onOpenShell={onOpenShell}
                onResizeSideways={(direction) => editor.scaleLaneWeight(board.id, lane.key, direction === 'left' ? 1 / WEIGHT_STEP : WEIGHT_STEP)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
