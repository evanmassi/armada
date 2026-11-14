import type { Board, LaneState, NotesTile, Tile } from '@shared/workspace/workspaceSchemas';
import { isBoardWideNote } from './boardQueries';

export const NOTES_STRIP_KEY = '<notes>';
export const HELPER_COLUMN_KEY = '<helpers>';
const HELPER_COLUMN_DEFAULT_WEIGHT = 0.5;

export interface Lane {
  key: string;
  tiles: Tile[];
  weight: number;
  isCollapsed: boolean;
}

export const laneStateOf = (board: Board, key: string): LaneState =>
  board.lanes[key] ?? { weight: key === HELPER_COLUMN_KEY ? HELPER_COLUMN_DEFAULT_WEIGHT : 1, isCollapsed: false };

export const lanedTiles = (board: Board): Tile[] => board.tiles.filter((tile) => !isBoardWideNote(tile));

export const boardWideNotes = (board: Board): NotesTile[] =>
  board.tiles.filter((tile): tile is NotesTile => isBoardWideNote(tile));

const laneKeysInAppearanceOrder = (tiles: Tile[]): string[] => [...new Set(tiles.flatMap((tile) => tile.cwd ?? []))];

export const hasMultipleLanes = (board: Board): boolean => laneKeysInAppearanceOrder(board.tiles).length > 1;

export function computeLanes(board: Board): Lane[] {
  const tiles = lanedTiles(board);
  const present = laneKeysInAppearanceOrder(tiles);
  const ordered = [...board.laneOrder.filter((key) => present.includes(key)), ...present.filter((key) => !board.laneOrder.includes(key))];
  return ordered.map((key) => ({ key, tiles: tiles.filter((tile) => tile.cwd === key), ...laneStateOf(board, key) }));
}
