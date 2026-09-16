import { describe, expect, it } from 'vitest';
import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { computeLanes, hasMultipleLanes, NOTES_LANE_KEY } from './lanes';

const claude = (id: string, cwd: string): Tile => ({ kind: 'claude', id, sessionId: id, cwd, layout: { x: 0, y: 0, w: 1, h: 1 }, weight: 1 });
const notes = (id: string): Tile => ({ kind: 'notes', id, text: '', layout: { x: 0, y: 0, w: 1, h: 1 }, weight: 1 });

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
  it('groups tiles by project in first-appearance order, notes in their own lane', () => {
    const lanes = computeLanes(board([claude('a', 'C:\\one'), claude('b', 'C:\\two'), notes('n'), claude('c', 'C:\\one')]));
    expect(lanes.map((lane) => [lane.key, lane.tiles.map((tile) => tile.id)])).toEqual([
      ['C:\\one', ['a', 'c']],
      ['C:\\two', ['b']],
      [NOTES_LANE_KEY, ['n']],
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

describe('hasMultipleLanes', () => {
  it('is true only when tiles span more than one project', () => {
    expect(hasMultipleLanes(board([claude('a', 'C:\\one'), claude('b', 'C:\\one')]))).toBe(false);
    expect(hasMultipleLanes(board([claude('a', 'C:\\one'), notes('n')]))).toBe(true);
  });
});
