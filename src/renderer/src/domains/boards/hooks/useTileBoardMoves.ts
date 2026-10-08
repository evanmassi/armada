import type { Tile } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useProjectNames } from '@renderer/domains/conversations';
import { useBoardsEditor } from './useBoardsEditor';

const LOOSE_NOTES_BOARD_NAME = 'Notes';

export function useTileBoardMoves() {
  const editor = useBoardsEditor();
  const nameOf = useProjectNames();
  const focusTile = useBoardSelectionStore((state) => state.focusTile);

  const moveToBoard = (fromBoardId: string, tiles: Tile[], toBoardId: string): void => {
    const [first] = tiles;
    if (!first) return;
    editor.moveTilesToBoard(fromBoardId, tiles.map((tile) => tile.id), toBoardId);
    focusTile(toBoardId, first.id);
  };

  const moveToNewBoard = (fromBoardId: string, tiles: Tile[]): void => {
    const [first] = tiles;
    if (!first) return;
    const projectCwd = first.cwd !== undefined && tiles.every((tile) => tile.cwd === first.cwd) ? first.cwd : undefined;
    const name = projectCwd ? nameOf(projectCwd) : LOOSE_NOTES_BOARD_NAME;
    const boardId = editor.moveTilesToNewBoard(fromBoardId, tiles.map((tile) => tile.id), { name, projectCwd });
    focusTile(boardId, first.id);
  };

  return { moveToBoard, moveToNewBoard };
}
