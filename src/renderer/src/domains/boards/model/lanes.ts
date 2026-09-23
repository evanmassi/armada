import type { Board, NotesTile, Tile } from '@shared/workspace/workspaceSchemas';
import { isBoardWideNote, tileCwd } from './boardQueries';

export const NOTES_STRIP_KEY = '<notes>';

export interface Lane {
  key: string;
  tiles: Tile[];
  weight: number;
  isCollapsed: boolean;
}

export const lanedTiles = (board: Board): Tile[] => board.tiles.filter((tile) => !isBoardWideNote(tile));

export const boardWideNotes = (board: Board): NotesTile[] =>
  board.tiles.filter((tile): tile is NotesTile => isBoardWideNote(tile));

export const laneKeysInAppearanceOrder = (tiles: Tile[]): string[] => [...new Set(tiles.flatMap((tile) => tileCwd(tile) ?? []))];

export const hasMultipleLanes = (board: Board): boolean => laneKeysInAppearanceOrder(board.tiles).length > 1;

export function soleProjectCwd(board: Board): string | undefined {
  const keys = laneKeysInAppearanceOrder(board.tiles);
  return keys.length === 1 ? keys[0] : undefined;
}

export function computeLanes(board: Board): Lane[] {
  const tiles = lanedTiles(board);
  const present = laneKeysInAppearanceOrder(tiles);
  const ordered = [...board.laneOrder.filter((key) => present.includes(key)), ...present.filter((key) => !board.laneOrder.includes(key))];
  return ordered.map((key) => ({
    key,
    tiles: tiles.filter((tile) => tileCwd(tile) === key),
    weight: board.lanes[key]?.weight ?? 1,
    isCollapsed: board.lanes[key]?.isCollapsed ?? false,
  }));
}
