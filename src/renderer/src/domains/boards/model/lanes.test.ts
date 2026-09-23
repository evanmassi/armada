import { describe, expect, it } from 'vitest';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { boardWideNotes, computeLanes, hasMultipleLanes, soleProjectCwd } from './lanes';

const claude = (id: string, cwd: string): Tile => ({ kind: 'claude', id, sessionId: id, cwd, layout: { x: 0, y: 0, w: 1, h: 1 }, weight: 1 });
const notes = (id: string, cwd?: string): Tile => ({ kind: 'notes', id, text: '', cwd, layout: { x: 0, y: 0, w: 1, h: 1 }, weight: 1 });

const board = (tiles: Tile[], overrides: Partial<Board> = {}): Board => ({
  id: 'b',
  name: 'B',
  layoutMode: 'auto',
  rowWeights: [],
  lanes: {},
  laneOrder: [],
  tiles,
  ...overrides,
});

describe('computeLanes', () => {
  it('groups tiles by project in first-appearance order; project notes join their lane, board-wide notes stay out', () => {
    const lanes = computeLanes(board([claude('a', 'C:\\one'), claude('b', 'C:\\two'), notes('n'), notes('m', 'C:\\one'), claude('c', 'C:\\one')]));
    expect(lanes.map((lane) => [lane.key, lane.tiles.map((tile) => tile.id)])).toEqual([
      ['C:\\one', ['a', 'm', 'c']],
      ['C:\\two', ['b']],
    ]);
  });

  it('applies saved order, weights, and collapse state and ignores stale lane keys', () => {
    const lanes = computeLanes(
      board([claude('a', 'C:\\one'), claude('b', 'C:\\two')], {
        laneOrder: ['C:\\gone', 'C:\\two'],
        lanes: { 'C:\\two': { weight: 2, isCollapsed: true } },
      }),
    );
    expect(lanes.map((lane) => [lane.key, lane.weight, lane.isCollapsed])).toEqual([
      ['C:\\two', 2, true],
      ['C:\\one', 1, false],
    ]);
  });
});

describe('hasMultipleLanes and boardWideNotes', () => {
  it('counts projects only, never board-wide notes', () => {
    expect(hasMultipleLanes(board([claude('a', 'C:\\one'), notes('n')]))).toBe(false);
    expect(hasMultipleLanes(board([claude('a', 'C:\\one'), notes('n', 'C:\\two')]))).toBe(true);
    expect(boardWideNotes(board([claude('a', 'C:\\one'), notes('n'), notes('m', 'C:\\one')])).map((tile) => tile.id)).toEqual(['n']);
  });

  it('names the one project a board holds, and none when it holds several or none', () => {
    expect(soleProjectCwd(board([claude('a', 'C:\\one'), notes('n'), claude('b', 'C:\\one')]))).toBe('C:\\one');
    expect(soleProjectCwd(board([claude('a', 'C:\\one'), claude('b', 'C:\\two')]))).toBeUndefined();
    expect(soleProjectCwd(board([notes('n')]))).toBeUndefined();
  });
});
