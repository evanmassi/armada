import { describe, expect, it } from 'vitest';
import type { Tile, Workspace } from '@shared/workspace/workspaceSchemas';
import {
  addTile,
  applyLayouts,
  findFreePosition,
  GRID_COLUMNS,
  hasLayoutChanged,
  moveTile,
  nudgeTile,
  reflowFreeLayout,
  scaleTileWeight,
  setTileWeights,
  swapTiles,
} from './boardEdits';

const tile = (id: string, x: number, y: number, w: number, h: number, weight = 1): Tile => ({
  id,
  sessionId: id,
  cwd: 'C:\\dev',
  layout: { x, y, w, h },
  weight,
});

const workspaceWith = (...tiles: Tile[]): Workspace => ({
  boards: [{ id: 'board', name: 'Board', layoutMode: 'auto', rowWeights: [], tiles }],
  projectColors: { 'C:\\dev': 'red' },
});

const tileIds = (workspace: Workspace): string[] => workspace.boards[0]!.tiles.map((item) => item.id);

describe('findFreePosition', () => {
  it('fills the first row before starting a new one', () => {
    expect(findFreePosition([tile('a', 0, 0, 6, 14)], 6, 14)).toEqual({ x: 6, y: 0 });
    expect(findFreePosition([tile('a', 0, 0, 6, 14), tile('b', 6, 0, 6, 14)], 6, 14)).toEqual({ x: 0, y: 14 });
  });
});

describe('addTile', () => {
  it('appends a unit-weight tile at a free position and leaves project colors untouched', () => {
    const workspace = addTile(workspaceWith(tile('a', 0, 0, 6, 14)), 'board', { sessionId: 'new', cwd: 'C:\\dev' });
    const added = workspace.boards[0]!.tiles[1]!;
    expect(added.layout).toEqual({ x: 6, y: 0, w: 6, h: 14 });
    expect(added.weight).toBe(1);
    expect(workspace.projectColors).toEqual({ 'C:\\dev': 'red' });
  });
});

describe('swapTiles and moveTile', () => {
  const three = workspaceWith(tile('a', 0, 0, 4, 6), tile('b', 4, 0, 4, 6), tile('c', 8, 0, 4, 6));

  it('swaps two tiles by id and ignores unknown ids', () => {
    expect(tileIds(swapTiles(three, 'board', 'a', 'c'))).toEqual(['c', 'b', 'a']);
    expect(tileIds(swapTiles(three, 'board', 'a', 'zzz'))).toEqual(['a', 'b', 'c']);
  });

  it('moves a tile one step and stops at the edges', () => {
    expect(tileIds(moveTile(three, 'board', 'b', 1))).toEqual(['a', 'c', 'b']);
    expect(tileIds(moveTile(three, 'board', 'a', -1))).toEqual(['a', 'b', 'c']);
  });
});

describe('weights', () => {
  it('sets and clamps tile weights', () => {
    const workspace = setTileWeights(workspaceWith(tile('a', 0, 0, 4, 6), tile('b', 4, 0, 4, 6)), 'board', { a: 9, b: 0.01 });
    expect(workspace.boards[0]!.tiles.map((item) => item.weight)).toEqual([4, 0.25]);
  });

  it('scales a single tile weight', () => {
    expect(scaleTileWeight(workspaceWith(tile('a', 0, 0, 4, 6, 2)), 'board', 'a', 1.5).boards[0]!.tiles[0]!.weight).toBe(3);
  });
});

describe('reflowFreeLayout', () => {
  it('rewrites free layouts from the tiling so tiles fill the visible area', () => {
    const workspace = reflowFreeLayout(workspaceWith(tile('a', 0, 0, 3, 6), tile('b', 0, 30, 3, 6)), 'board', 24 * 20 + 8 * 21);
    expect(workspace.boards[0]!.tiles.map((item) => item.layout)).toEqual([
      { x: 0, y: 0, w: 6, h: 20 },
      { x: 6, y: 0, w: 6, h: 20 },
    ]);
  });
});

describe('applyLayouts and nudgeTile', () => {
  it('clamps positions inside the grid', () => {
    const workspace = applyLayouts(workspaceWith(tile('a', 0, 0, 6, 14)), 'board', [{ i: 'a', x: 10, y: 0, w: 6, h: 14 }]);
    expect(workspace.boards[0]!.tiles[0]!.layout.x).toBe(GRID_COLUMNS - 6);
  });

  it('nudges by a delta without going below the minimum size', () => {
    const workspace = nudgeTile(workspaceWith(tile('a', 2, 0, 3, 6)), 'board', 'a', { x: -1, w: -1 });
    expect(workspace.boards[0]!.tiles[0]!.layout).toEqual({ x: 1, y: 0, w: 3, h: 6 });
  });
});

describe('hasLayoutChanged', () => {
  it('is false when every layout matches the board', () => {
    const board = workspaceWith(tile('a', 0, 0, 6, 14)).boards[0]!;
    expect(hasLayoutChanged(board, [{ i: 'a', x: 0, y: 0, w: 6, h: 14 }])).toBe(false);
    expect(hasLayoutChanged(board, [{ i: 'a', x: 1, y: 0, w: 6, h: 14 }])).toBe(true);
  });
});
