import { TILE_COLORS, type Board, type BoardsDocument, type Tile, type TileColor, type TileLayout } from '@shared/boards/boardSchemas';

export const GRID_COLUMNS = 12;
const DEFAULT_TILE_WIDTH = 6;
const DEFAULT_TILE_HEIGHT = 14;
const MIN_TILE_WIDTH = 3;
const MIN_TILE_HEIGHT = 6;

export interface TileSeed {
  sessionId: string;
  cwd: string;
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

const clampLayout = (layout: TileLayout): TileLayout => ({
  x: Math.max(0, Math.min(layout.x, GRID_COLUMNS - layout.w)),
  y: Math.max(0, layout.y),
  w: Math.max(MIN_TILE_WIDTH, Math.min(layout.w, GRID_COLUMNS)),
  h: Math.max(MIN_TILE_HEIGHT, layout.h),
});

const updateBoard = (document: BoardsDocument, boardId: string, transform: (board: Board) => Board): BoardsDocument => ({
  boards: document.boards.map((board) => (board.id === boardId ? transform(board) : board)),
});

const updateTile = (document: BoardsDocument, boardId: string, tileId: string, transform: (tile: Tile) => Tile): BoardsDocument =>
  updateBoard(document, boardId, (board) => ({
    ...board,
    tiles: board.tiles.map((tile) => (tile.id === tileId ? transform(tile) : tile)),
  }));

export const createBoard = (name: string): Board => ({ id: crypto.randomUUID(), name, tiles: [] });

export const addBoard = (document: BoardsDocument, board: Board): BoardsDocument => ({ boards: [...document.boards, board] });

export const renameBoard = (document: BoardsDocument, boardId: string, name: string): BoardsDocument =>
  updateBoard(document, boardId, (board) => ({ ...board, name }));

export const removeBoard = (document: BoardsDocument, boardId: string): BoardsDocument => ({
  boards: document.boards.filter((board) => board.id !== boardId),
});

export const addTile = (document: BoardsDocument, boardId: string, seed: TileSeed): BoardsDocument =>
  updateBoard(document, boardId, (board) => {
    const position = findFreePosition(board.tiles, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT);
    const tile: Tile = {
      id: crypto.randomUUID(),
      sessionId: seed.sessionId,
      cwd: seed.cwd,
      color: TILE_COLORS[board.tiles.length % TILE_COLORS.length]!,
      layout: { ...position, w: DEFAULT_TILE_WIDTH, h: DEFAULT_TILE_HEIGHT },
    };
    return { ...board, tiles: [...board.tiles, tile] };
  });

export const removeTile = (document: BoardsDocument, boardId: string, tileId: string): BoardsDocument =>
  updateBoard(document, boardId, (board) => ({ ...board, tiles: board.tiles.filter((tile) => tile.id !== tileId) }));

export const setTileColor = (document: BoardsDocument, boardId: string, tileId: string, color: TileColor): BoardsDocument =>
  updateTile(document, boardId, tileId, (tile) => ({ ...tile, color }));

export const applyLayouts = (document: BoardsDocument, boardId: string, layouts: PositionedLayout[]): BoardsDocument => {
  const byTileId = new Map(layouts.map(({ i, ...layout }) => [i, layout]));
  return updateBoard(document, boardId, (board) => ({
    ...board,
    tiles: board.tiles.map((tile) => {
      const layout = byTileId.get(tile.id);
      return layout ? { ...tile, layout: clampLayout(layout) } : tile;
    }),
  }));
};

export const nudgeTile = (document: BoardsDocument, boardId: string, tileId: string, delta: Partial<TileLayout>): BoardsDocument =>
  updateTile(document, boardId, tileId, (tile) => ({
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
