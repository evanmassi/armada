import { describe, expect, it } from 'vitest';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { columnsFor, computeTiling, tilingToCells } from './tiling';

const tile = (id: string, weight = 1): Tile => ({
  kind: 'claude',
  id,
  sessionId: id,
  cwd: 'C:\\dev',
  layout: { x: 0, y: 0, w: 1, h: 1 },
  weight,
});

const board = (tiles: Tile[], rowWeights: number[] = []): Board => ({
  id: 'board',
  name: 'Board',
  layoutMode: 'auto',
  rowWeights,
  lanes: {},
  laneOrder: [],
  tiles,
});

describe('columnsFor', () => {
  it('picks 1, 2, 3, 2x2, then three columns', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(columnsFor)).toEqual([1, 1, 2, 3, 2, 3, 3, 3]);
  });
});

describe('computeTiling', () => {
  it('splits five tiles into a row of three and a row of two with equal row weights', () => {
    const rows = computeTiling(board(['a', 'b', 'c', 'd', 'e'].map((id) => tile(id))));
    expect(rows.map((row) => row.tiles.map((item) => item.id))).toEqual([['a', 'b', 'c'], ['d', 'e']]);
    expect(rows.map((row) => row.weight)).toEqual([1, 1]);
  });

  it('keeps stored row weights only when they match the row count', () => {
    const tiles = ['a', 'b', 'c', 'd'].map((id) => tile(id));
    expect(computeTiling(board(tiles, [2, 1])).map((row) => row.weight)).toEqual([2, 1]);
    expect(computeTiling(board(tiles, [2, 1, 1])).map((row) => row.weight)).toEqual([1, 1]);
  });
});

describe('tilingToCells', () => {
  it('maps weights onto integer grid spans that tile the whole area', () => {
    const cells = tilingToCells(board([tile('a', 2), tile('b', 1), tile('c'), tile('d')], [1, 1]), 12, 20);
    expect(cells).toEqual([
      { tileId: 'a', x: 0, y: 0, w: 8, h: 10 },
      { tileId: 'b', x: 8, y: 0, w: 4, h: 10 },
      { tileId: 'c', x: 0, y: 10, w: 6, h: 10 },
      { tileId: 'd', x: 6, y: 10, w: 6, h: 10 },
    ]);
  });
});
