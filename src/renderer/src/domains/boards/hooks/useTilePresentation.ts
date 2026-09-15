import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useConversationTitles, useProjectAccents } from '@renderer/domains/conversations';

const NEW_SESSION_TITLE = 'New session';
const SHELL_TITLE = 'shell';
const NOTES_TITLE = 'notes';

export interface TilePresentation {
  title: string;
  accentColor: string;
}

export function useTilePresentation(): (tile: Tile) => TilePresentation {
  const titles = useConversationTitles();
  const accentFor = useProjectAccents();
  return (tile) => {
    if (tile.kind === 'claude') return { title: titles.get(tile.sessionId) ?? NEW_SESSION_TITLE, accentColor: accentFor(tile.cwd) };
    if (tile.kind === 'shell') return { title: SHELL_TITLE, accentColor: accentFor(tile.cwd) };
    return { title: NOTES_TITLE, accentColor: accentFor(undefined) };
  };
}
