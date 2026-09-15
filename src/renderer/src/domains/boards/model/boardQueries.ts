import type { ClaudeTile, Tile, Workspace } from '@shared/workspace/workspaceSchemas';

export const tileCwd = (tile: Tile): string | undefined => (tile.kind === 'notes' ? undefined : tile.cwd);

export interface TileLocation {
  boardId: string;
  tile: ClaudeTile;
}

export function findClaudeTile(workspace: Workspace, sessionId: string): TileLocation | undefined {
  for (const board of workspace.boards) {
    const tile = board.tiles.find((candidate): candidate is ClaudeTile => candidate.kind === 'claude' && candidate.sessionId === sessionId);
    if (tile) return { boardId: board.id, tile };
  }
  return undefined;
}
