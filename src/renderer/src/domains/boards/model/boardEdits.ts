import type { Board, LayoutMode, Tile, TileLayout, Workspace } from '@shared/workspace/workspaceSchemas';
import { tileCwd } from './boardQueries';
import { tilingToCells } from './tiling';

export const GRID_COLUMNS = 12;
export const GRID_ROW_HEIGHT_PX = 24;
export const GRID_MARGIN_PX = 8;
const DEFAULT_TILE_WIDTH = 6;
const DEFAULT_TILE_HEIGHT = 14;
const MIN_TILE_WIDTH = 3;
const MIN_TILE_HEIGHT = 6;
const MIN_WEIGHT = 0.25;
const MAX_WEIGHT = 4;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type TileSeed = DistributiveOmit<Tile, 'id' | 'layout' | 'weight'>;

export interface BoardSeed {
  name: string;
  projectCwd?: string;
  tiles?: TileSeed[];
}

export interface PositionedLayout extends TileLayout {
  i: string;
}

const overlaps = (a: TileLayout, b: TileLayout): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function findFreePosition(tiles: Tile[], w: number, h: number): { x: number; y: number } {
  const bottom = tiles.reduce((max, tile) => Math.max(max, tile.layout.y + tile.layout.h), 0);
  for (let y = 0; y <= bottom; y += 1) {
    for (let x = 0; x + w <= GRID_COLUMNS; x += 1) {
      const candidate = { x, y, w, h };
      if (!tiles.some((tile) => overlaps(tile.layout, candidate))) return { x, y };
    }
  }
  return { x: 0, y: bottom };
}

export const visibleGridRows = (containerHeightPx: number): number =>
  Math.max(MIN_TILE_HEIGHT, Math.floor((containerHeightPx - GRID_MARGIN_PX) / (GRID_ROW_HEIGHT_PX + GRID_MARGIN_PX)));

const clampLayout = (layout: TileLayout): TileLayout => ({
  x: Math.max(0, Math.min(layout.x, GRID_COLUMNS - layout.w)),
  y: Math.max(0, layout.y),
  w: Math.max(MIN_TILE_WIDTH, Math.min(layout.w, GRID_COLUMNS)),
  h: Math.max(MIN_TILE_HEIGHT, layout.h),
});

const clampWeight = (weight: number): number => Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight));

const updateBoard = (workspace: Workspace, boardId: string, transform: (board: Board) => Board): Workspace => ({
  ...workspace,
  boards: workspace.boards.map((board) => (board.id === boardId ? transform(board) : board)),
});

const updateTile = (workspace: Workspace, boardId: string, tileId: string, transform: (tile: Tile) => Tile): Workspace =>
  updateBoard(workspace, boardId, (board) => ({
    ...board,
    tiles: board.tiles.map((tile) => (tile.id === tileId ? transform(tile) : tile)),
  }));

const seedCwd = (seed: TileSeed): string | undefined => (seed.kind === 'notes' ? undefined : seed.cwd);

const insertionIndex = (tiles: Tile[], seed: TileSeed, afterTileId: string | undefined): number => {
  const anchorIndex = afterTileId ? tiles.findIndex((tile) => tile.id === afterTileId) : -1;
  if (anchorIndex >= 0) return anchorIndex + 1;
  const cwd = seedCwd(seed);
  const lastSiblingIndex = cwd ? tiles.findLastIndex((tile) => tileCwd(tile) === cwd) : -1;
  return lastSiblingIndex >= 0 ? lastSiblingIndex + 1 : tiles.length;
};

const appendTile = (board: Board, seed: TileSeed, afterTileId?: string): Board => {
  const position = findFreePosition(board.tiles, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT);
  const tile: Tile = { ...seed, id: crypto.randomUUID(), layout: { ...position, w: DEFAULT_TILE_WIDTH, h: DEFAULT_TILE_HEIGHT }, weight: 1 };
  const tiles = [...board.tiles];
  tiles.splice(insertionIndex(board.tiles, seed, afterTileId), 0, tile);
  return { ...board, tiles };
};

export const createBoard = ({ name, projectCwd, tiles = [] }: BoardSeed): Board =>
  tiles.reduce<Board>((board, seed) => appendTile(board, seed), {
    id: crypto.randomUUID(),
    name,
    projectCwd,
    layoutMode: 'auto',
    rowWeights: [],
    tiles: [],
  });

export const addBoard = (workspace: Workspace, board: Board): Workspace => ({
  ...workspace,
  boards: [...workspace.boards, board],
});

export const renameBoard = (workspace: Workspace, boardId: string, name: string): Workspace =>
  updateBoard(workspace, boardId, (board) => ({ ...board, name }));

export const removeBoard = (workspace: Workspace, boardId: string): Workspace => ({
  ...workspace,
  boards: workspace.boards.filter((board) => board.id !== boardId),
});

export const setLayoutMode = (workspace: Workspace, boardId: string, layoutMode: LayoutMode): Workspace =>
  updateBoard(workspace, boardId, (board) => ({ ...board, layoutMode }));

export const addTile = (workspace: Workspace, boardId: string, seed: TileSeed, afterTileId?: string): Workspace =>
  updateBoard(workspace, boardId, (board) => appendTile(board, seed, afterTileId));

export const removeTile = (workspace: Workspace, boardId: string, tileId: string): Workspace =>
  updateBoard(workspace, boardId, (board) => ({ ...board, tiles: board.tiles.filter((tile) => tile.id !== tileId) }));

export const setNotesText = (workspace: Workspace, boardId: string, tileId: string, text: string): Workspace =>
  updateTile(workspace, boardId, tileId, (tile) => (tile.kind === 'notes' ? { ...tile, text } : tile));

export const swapTiles = (workspace: Workspace, boardId: string, tileIdA: string, tileIdB: string): Workspace =>
  updateBoard(workspace, boardId, (board) => {
    const indexA = board.tiles.findIndex((tile) => tile.id === tileIdA);
    const indexB = board.tiles.findIndex((tile) => tile.id === tileIdB);
    if (indexA < 0 || indexB < 0 || indexA === indexB) return board;
    const tiles = [...board.tiles];
    [tiles[indexA], tiles[indexB]] = [tiles[indexB]!, tiles[indexA]!];
    return { ...board, tiles };
  });

export const moveTile = (workspace: Workspace, boardId: string, tileId: string, step: -1 | 1): Workspace => {
  const board = workspace.boards.find((item) => item.id === boardId);
  const neighbor = board?.tiles[board.tiles.findIndex((tile) => tile.id === tileId) + step];
  return neighbor ? swapTiles(workspace, boardId, tileId, neighbor.id) : workspace;
};

export const setTileWeights = (workspace: Workspace, boardId: string, weights: Record<string, number>): Workspace =>
  updateBoard(workspace, boardId, (board) => ({
    ...board,
    tiles: board.tiles.map((tile) => (tile.id in weights ? { ...tile, weight: clampWeight(weights[tile.id]!) } : tile)),
  }));

export const scaleTileWeight = (workspace: Workspace, boardId: string, tileId: string, factor: number): Workspace =>
  updateTile(workspace, boardId, tileId, (tile) => ({ ...tile, weight: clampWeight(tile.weight * factor) }));

export const setRowWeights = (workspace: Workspace, boardId: string, rowWeights: number[]): Workspace =>
  updateBoard(workspace, boardId, (board) => ({ ...board, rowWeights: rowWeights.map(clampWeight) }));

export const applyLayouts = (workspace: Workspace, boardId: string, layouts: PositionedLayout[]): Workspace => {
  const byTileId = new Map(layouts.map(({ i, ...layout }) => [i, layout]));
  return updateBoard(workspace, boardId, (board) => ({
    ...board,
    tiles: board.tiles.map((tile) => {
      const layout = byTileId.get(tile.id);
      return layout ? { ...tile, layout: clampLayout(layout) } : tile;
    }),
  }));
};

export const reflowFreeLayout = (workspace: Workspace, boardId: string, containerHeightPx: number): Workspace => {
  const board = workspace.boards.find((item) => item.id === boardId);
  if (!board) return workspace;
  const cells = tilingToCells(board, GRID_COLUMNS, visibleGridRows(containerHeightPx));
  return applyLayouts(workspace, boardId, cells.map(({ tileId, ...layout }) => ({ i: tileId, ...layout })));
};

export const nudgeTile = (workspace: Workspace, boardId: string, tileId: string, delta: Partial<TileLayout>): Workspace =>
  updateTile(workspace, boardId, tileId, (tile) => ({
    ...tile,
    layout: clampLayout({
      x: tile.layout.x + (delta.x ?? 0),
      y: tile.layout.y + (delta.y ?? 0),
      w: tile.layout.w + (delta.w ?? 0),
      h: tile.layout.h + (delta.h ?? 0),
    }),
  }));

export const hasLayoutChanged = (board: Board, layouts: PositionedLayout[]): boolean =>
  layouts.some(({ i, x, y, w, h }) => {
    const tile = board.tiles.find((candidate) => candidate.id === i);
    return !tile || tile.layout.x !== x || tile.layout.y !== y || tile.layout.w !== w || tile.layout.h !== h;
  });
