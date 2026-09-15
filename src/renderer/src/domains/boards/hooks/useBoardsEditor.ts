import type { LayoutMode, TileLayout } from '@shared/workspace/workspaceSchemas';
import { useWorkspaceEditor } from '@renderer/domains/workspace';
import {
  addBoard,
  addTile,
  applyLayouts,
  createBoard,
  moveTile,
  nudgeTile,
  reflowFreeLayout,
  removeBoard,
  removeTile,
  renameBoard,
  scaleTileWeight,
  setLayoutMode,
  setNotesText,
  setRowWeights,
  setTileWeights,
  swapTiles,
  type BoardSeed,
  type PositionedLayout,
  type TileSeed,
} from '../model/boardEdits';

export function useBoardsEditor() {
  const { edit } = useWorkspaceEditor();

  return {
    createBoard: (seed: BoardSeed): string => {
      const board = createBoard(seed);
      edit((workspace) => addBoard(workspace, board));
      return board.id;
    },
    renameBoard: (boardId: string, name: string) => edit((workspace) => renameBoard(workspace, boardId, name)),
    removeBoard: (boardId: string) => edit((workspace) => removeBoard(workspace, boardId)),
    setLayoutMode: (boardId: string, layoutMode: LayoutMode) => edit((workspace) => setLayoutMode(workspace, boardId, layoutMode)),
    addTile: (boardId: string, seed: TileSeed, afterTileId?: string) =>
      edit((workspace) => addTile(workspace, boardId, seed, afterTileId)),
    removeTile: (boardId: string, tileId: string) => edit((workspace) => removeTile(workspace, boardId, tileId)),
    setNotesText: (boardId: string, tileId: string, text: string) => edit((workspace) => setNotesText(workspace, boardId, tileId, text)),
    swapTiles: (boardId: string, tileIdA: string, tileIdB: string) =>
      edit((workspace) => swapTiles(workspace, boardId, tileIdA, tileIdB)),
    moveTile: (boardId: string, tileId: string, step: -1 | 1) => edit((workspace) => moveTile(workspace, boardId, tileId, step)),
    setTileWeights: (boardId: string, weights: Record<string, number>) =>
      edit((workspace) => setTileWeights(workspace, boardId, weights)),
    scaleTileWeight: (boardId: string, tileId: string, factor: number) =>
      edit((workspace) => scaleTileWeight(workspace, boardId, tileId, factor)),
    setRowWeights: (boardId: string, rowWeights: number[]) => edit((workspace) => setRowWeights(workspace, boardId, rowWeights)),
    applyLayouts: (boardId: string, layouts: PositionedLayout[]) => edit((workspace) => applyLayouts(workspace, boardId, layouts)),
    reflowFreeLayout: (boardId: string, containerHeightPx: number) =>
      edit((workspace) => reflowFreeLayout(workspace, boardId, containerHeightPx)),
    nudgeTile: (boardId: string, tileId: string, delta: Partial<TileLayout>) =>
      edit((workspace) => nudgeTile(workspace, boardId, tileId, delta)),
  };
}
