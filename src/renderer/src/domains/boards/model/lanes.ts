import type { Board, Tile } from '@shared/workspace/workspaceSchemas';
import { tileCwd } from './boardQueries';

export const NOTES_LANE_KEY = '<notes>';

export interface Lane {
  key: string;
  tiles: Tile[];
  weight: number;
  isCollapsed: boolean;
}

export const laneKeyOf = (tile: Tile): string => tileCwd(tile) ?? NOTES_LANE_KEY;

export const laneKeysInAppearanceOrder = (tiles: Tile[]): string[] => [...new Set(tiles.map(laneKeyOf))];

export const hasMultipleLanes = (board: Board): boolean => laneKeysInAppearanceOrder(board.tiles).length > 1;

export function computeLanes(board: Board): Lane[] {
  const present = laneKeysInAppearanceOrder(board.tiles);
  const ordered = [...board.laneOrder.filter((key) => present.includes(key)), ...present.filter((key) => !board.laneOrder.includes(key))];
  return ordered.map((key) => ({
    key,
    tiles: board.tiles.filter((tile) => laneKeyOf(tile) === key),
    weight: board.lanes[key]?.weight ?? 1,
    isCollapsed: board.lanes[key]?.isCollapsed ?? false,
  }));
}
