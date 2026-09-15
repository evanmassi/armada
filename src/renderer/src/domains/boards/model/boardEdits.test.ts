import { describe, expect, it } from 'vitest';
import type { Tile, Workspace } from '@shared/workspace/workspaceSchemas';
import {
  addTile,
  applyLayouts,
  createBoard,
  findFreePosition,
  GRID_COLUMNS,
  hasLayoutChanged,
  moveTile,
  nudgeTile,
  reflowFreeLayout,
  scaleTileWeight,
  setNotesText,
  setTileWeights,
  swapTiles,
} from './boardEdits';

const tile = (id: string, x: number, y: number, w: number, h: number, weight = 1, cwd = 'C:\\dev'): Tile => ({
  kind: 'claude',
  id,
  sessionId: id,
  cwd,
  layout: { x, y, w, h },
  weight,
});

const workspaceWith = (...tiles: Tile[]): Workspace => ({
  boards: [{ id: 'board', name: 'Board', layoutMode: 'auto', rowWeights: [], tiles }],
  projectColors: { 'C:\\dev': 'red' },
  pinnedSessionIds: [],
  preferences: { terminalFontSize: 13 },
  sidebar: { width: 288, groups: [], projectOrder: [], archivedProjectCwds: [], archivedSessionIds: [], projectAliases: {}, projectExpansion: {} },
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
    const workspace = addTile(workspaceWith(tile('a', 0, 0, 6, 14)), 'board', { kind: 'claude', sessionId: 'new', cwd: 'C:\\dev' });
    const added = workspace.boards[0]!.tiles[1]!;
    expect(added.layout).toEqual({ x: 6, y: 0, w: 6, h: 14 });
    expect(added.weight).toBe(1);
    expect(workspace.projectColors).toEqual({ 'C:\\dev': 'red' });
  });

  it('places a tile after the last tile from the same project', () => {
    const start = workspaceWith(tile('a', 0, 0, 4, 6, 1, 'C:\\one'), tile('b', 4, 0, 4, 6, 1, 'C:\\two'), tile('c', 8, 0, 4, 6, 1, 'C:\\one'));
    const withShell = addTile(start, 'board', { kind: 'shell', cwd: 'C:\\one' });
    expect(withShell.boards[0]!.tiles.map((item) => item.kind)).toEqual(['claude', 'claude', 'claude', 'shell']);
    const withTwo = addTile(start, 'board', { kind: 'claude', sessionId: 'd', cwd: 'C:\\two' });
    expect(tileIds(withTwo)).toEqual(['a', 'b', withTwo.boards[0]!.tiles[2]!.id, 'c']);
  });

  it('places a tile directly after an anchor tile when asked', () => {
    const workspace = addTile(workspaceWith(tile('a', 0, 0, 4, 6), tile('b', 4, 0, 4, 6)), 'board', { kind: 'notes', text: '' }, 'a');
    expect(workspace.boards[0]!.tiles.map((item) => item.kind)).toEqual(['claude', 'notes', 'claude']);
  });
});

describe('createBoard', () => {
  it('seeds a project board with tiles in order', () => {
    const board = createBoard({
      name: 'armada',
      projectCwd: 'C:\\dev',
      tiles: [
        { kind: 'claude', sessionId: 'x', cwd: 'C:\\dev' },
        { kind: 'claude', sessionId: 'y', cwd: 'C:\\dev' },
      ],
    });
    expect(board.projectCwd).toBe('C:\\dev');
    expect(board.tiles.map((item) => (item.kind === 'claude' ? item.sessionId : ''))).toEqual(['x', 'y']);
  });
});

describe('setNotesText', () => {
  it('updates notes tiles only', () => {
    const notes: Tile = { kind: 'notes', id: 'n', text: '', layout: { x: 0, y: 0, w: 3, h: 6 }, weight: 1 };
    const workspace = setNotesText(workspaceWith(tile('a', 0, 0, 3, 6), notes), 'board', 'n', 'hello');
    expect(workspace.boards[0]!.tiles[1]).toMatchObject({ kind: 'notes', text: 'hello' });
    expect(setNotesText(workspace, 'board', 'a', 'x').boards[0]!.tiles[0]).toEqual(tile('a', 0, 0, 3, 6));
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
