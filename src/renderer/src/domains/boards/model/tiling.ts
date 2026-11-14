import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { HELPER_COLUMN_KEY, lanedTiles, laneStateOf } from './lanes';

interface TilingRow {
  tiles: Tile[];
  weight: number;
}

interface TilingSections {
  mainTiles: Tile[];
  helperTiles: Tile[];
}

export const columnsFor = (tileCount: number): number => {
  if (tileCount <= 1) return 1;
  if (tileCount === 2 || tileCount === 4) return 2;
  return 3;
};

const isSessionTile = (tile: Tile): boolean => tile.kind === 'claude';

export const tilingSections = (board: Board): TilingSections => {
  const tiles = lanedTiles(board);
  if (!tiles.some(isSessionTile)) return { mainTiles: tiles, helperTiles: [] };
  return { mainTiles: tiles.filter(isSessionTile), helperTiles: tiles.filter((tile) => !isSessionTile(tile)) };
};

const chunkTilesIntoRows = (tiles: Tile[]): Tile[][] => {
  const columns = columnsFor(tiles.length);
  const rows: Tile[][] = [];
  for (let start = 0; start < tiles.length; start += columns) rows.push(tiles.slice(start, start + columns));
  return rows;
};

const normalizeRowWeights = (rowWeights: number[], rowCount: number): number[] =>
  rowWeights.length === rowCount ? rowWeights : Array.from({ length: rowCount }, () => 1);

const tilingOf = (board: Board, tiles: Tile[]): TilingRow[] => {
  const rows = chunkTilesIntoRows(tiles);
  const weights = normalizeRowWeights(board.rowWeights, rows.length);
  return rows.map((rowTiles, index) => ({ tiles: rowTiles, weight: weights[index]! }));
};

export const collapsedTiles = (board: Board): Tile[] => tilingSections(board).mainTiles.filter((tile) => tile.isCollapsed);

export const computeTiling = (board: Board): TilingRow[] =>
  tilingOf(board, tilingSections(board).mainTiles.filter((tile) => !tile.isCollapsed));

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

interface Span {
  start: number;
  size: number;
}

const spansOf = (weights: number[], length: number, offset = 0): Span[] => {
  const total = sum(weights);
  let cumulative = 0;
  let start = offset;
  return weights.map((weight) => {
    cumulative += weight;
    const end = offset + Math.round((length * cumulative) / total);
    const span = { start, size: end - start };
    start = end;
    return span;
  });
};

interface CellSpan {
  tileId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// PITFALL: the free grid shows a collapsed tile at full size, so its cells come from every tile, not only the expanded ones.
export function tilingToCells(board: Board, columns: number, rows: number): CellSpan[] {
  const { mainTiles, helperTiles } = tilingSections(board);
  const [mainSpan, helperSpan] = helperTiles.length > 0 ? spansOf([1, laneStateOf(board, HELPER_COLUMN_KEY).weight], columns) : [{ start: 0, size: columns }];
  const tiling = tilingOf(board, mainTiles);
  const rowSpans = spansOf(tiling.map((row) => row.weight), rows);
  const mainCells = tiling.flatMap((row, rowIndex) =>
    spansOf(row.tiles.map((tile) => tile.weight), mainSpan!.size, mainSpan!.start).map((column, tileIndex) => ({
      tileId: row.tiles[tileIndex]!.id,
      x: column.start,
      y: rowSpans[rowIndex]!.start,
      w: column.size,
      h: rowSpans[rowIndex]!.size,
    })),
  );
  const helperCells = helperSpan
    ? spansOf(helperTiles.map((tile) => tile.weight), rows).map((row, index) => ({ tileId: helperTiles[index]!.id, x: helperSpan.start, y: row.start, w: helperSpan.size, h: row.size }))
    : [];
  return [...mainCells, ...helperCells];
}
