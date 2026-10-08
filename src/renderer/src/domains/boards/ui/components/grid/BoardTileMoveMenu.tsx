import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useWorkspaceQuery } from '@renderer/domains/workspace';
import { ActionContextMenu, type ContextMenuOpening } from '@renderer/shared/ui/components/ActionContextMenu';
import type { ActionMenuEntry } from '@renderer/shared/ui/components/ActionMenuList';
import { useTileBoardMoves } from '../../../hooks/useTileBoardMoves';

interface BoardTileMoveMenuProps extends ContextMenuOpening {
  boardId: string;
  tiles: Tile[];
  onClose(): void;
}

export function BoardTileMoveMenu({ boardId, tiles, point, isOpenedByKeyboard, onClose }: BoardTileMoveMenuProps) {
  const boards = useWorkspaceQuery().data?.boards ?? [];
  const { moveToBoard, moveToNewBoard } = useTileBoardMoves();
  const otherBoards = boards.filter((board) => board.id !== boardId);

  const entries: ActionMenuEntry[] = [
    ...otherBoards.map((board) => ({ label: 'Move to', emphasis: board.name, onSelect: () => moveToBoard(boardId, tiles, board.id) })),
    ...(otherBoards.length > 0 ? ['divider' as const] : []),
    { label: 'Move to', emphasis: 'New board', onSelect: () => moveToNewBoard(boardId, tiles) },
  ];

  return <ActionContextMenu point={point} isOpenedByKeyboard={isOpenedByKeyboard} entries={entries} onClose={onClose} />;
}
