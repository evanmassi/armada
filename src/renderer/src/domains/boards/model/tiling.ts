import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { lanedTiles } from './lanes';

interface TilingRow {
  tiles: Tile[];
  weight: number;
}

export const columnsFor = (tileCount: number): number => {
  if (tileCount <= 1) return 1;
  if (tileCount === 2 || tileCount === 4) return 2;
  return 3;
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

export const collapsedTiles = (board: Board): Tile[] => lanedTiles(board).filter((tile) => tile.isCollapsed);

export const computeTiling = (board: Board): TilingRow[] =>
  tilingOf(board, lanedTiles(board).filter((tile) => !tile.isCollapsed));

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

interface CellSpan {
  tileId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// PITFALL: the free grid shows a collapsed tile at full size, so its cells come from every tile, not only the expanded ones.
export function tilingToCells(board: Board, columns: number, rows: number): CellSpan[] {
  const tiling = tilingOf(board, lanedTiles(board));
  const totalRowWeight = sum(tiling.map((row) => row.weight));
  const cells: CellSpan[] = [];
  let rowStart = 0;
  let cumulativeRowWeight = 0;
  for (const row of tiling) {
    cumulativeRowWeight += row.weight;
    const rowEnd = Math.round((rows * cumulativeRowWeight) / totalRowWeight);
    const totalTileWeight = sum(row.tiles.map((tile) => tile.weight));
    let columnStart = 0;
    let cumulativeTileWeight = 0;
    for (const tile of row.tiles) {
      cumulativeTileWeight += tile.weight;
      const columnEnd = Math.round((columns * cumulativeTileWeight) / totalTileWeight);
      cells.push({ tileId: tile.id, x: columnStart, y: rowStart, w: columnEnd - columnStart, h: rowEnd - rowStart });
      columnStart = columnEnd;
    }
    rowStart = rowEnd;
  }
  return cells;
}
