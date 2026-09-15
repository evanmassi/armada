import { describe, expect, it } from 'vitest';
import type { Tile } from '@shared/boards/boardSchemas';
import { addTile, applyLayouts, findFreePosition, GRID_COLUMNS, hasLayoutChanged, nudgeTile } from './boardDocumentEdits';

const tile = (id: string, x: number, y: number, w: number, h: number): Tile => ({
  id,
  sessionId: id,
  cwd: 'C:\\dev',
  color: 'slate',
  layout: { x, y, w, h },
});

const boardWith = (...tiles: Tile[]) => ({ boards: [{ id: 'board', name: 'Board', tiles }] });

describe('findFreePosition', () => {
  it('fills the first row before starting a new one', () => {
    expect(findFreePosition([tile('a', 0, 0, 6, 14)], 6, 14)).toEqual({ x: 6, y: 0 });
    expect(findFreePosition([tile('a', 0, 0, 6, 14), tile('b', 6, 0, 6, 14)], 6, 14)).toEqual({ x: 0, y: 14 });
  });
});

describe('addTile', () => {
  it('appends a tile with a distinct color and a free position', () => {
    const document = addTile(boardWith(tile('a', 0, 0, 6, 14)), 'board', { sessionId: 'new', cwd: 'C:\\dev' });
    const added = document.boards[0]!.tiles[1]!;
    expect(added.layout).toEqual({ x: 6, y: 0, w: 6, h: 14 });
    expect(added.color).not.toBe('slate');
  });
});

describe('applyLayouts and nudgeTile', () => {
  it('clamps positions inside the grid', () => {
    const document = applyLayouts(boardWith(tile('a', 0, 0, 6, 14)), 'board', [{ i: 'a', x: 10, y: 0, w: 6, h: 14 }]);
    expect(document.boards[0]!.tiles[0]!.layout.x).toBe(GRID_COLUMNS - 6);
  });

  it('nudges by a delta without going below the minimum size', () => {
    const document = nudgeTile(boardWith(tile('a', 2, 0, 3, 6)), 'board', 'a', { x: -1, w: -1 });
    expect(document.boards[0]!.tiles[0]!.layout).toEqual({ x: 1, y: 0, w: 3, h: 6 });
  });
});

describe('hasLayoutChanged', () => {
  it('is false when every layout matches the board', () => {
    const board = boardWith(tile('a', 0, 0, 6, 14)).boards[0]!;
    expect(hasLayoutChanged(board, [{ i: 'a', x: 0, y: 0, w: 6, h: 14 }])).toBe(false);
    expect(hasLayoutChanged(board, [{ i: 'a', x: 1, y: 0, w: 6, h: 14 }])).toBe(true);
  });
});
