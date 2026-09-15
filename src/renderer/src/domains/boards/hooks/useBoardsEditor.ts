import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BoardsDocument, TileColor, TileLayout } from '@shared/boards/boardSchemas';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import {
  addBoard,
  addTile,
  applyLayouts,
  createBoard,
  nudgeTile,
  removeBoard,
  removeTile,
  renameBoard,
  setTileColor,
  type PositionedLayout,
  type TileSeed,
} from '../model/boardDocumentEdits';

type DocumentEdit = (document: BoardsDocument) => BoardsDocument;

export function useBoardsEditor() {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (document: BoardsDocument) => armadaClient.boards.save(document),
    onMutate: (document) => queryClient.setQueryData(queryKeys.boards, document),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
  });

  const edit = (transform: DocumentEdit): void => {
    const current = queryClient.getQueryData<BoardsDocument>(queryKeys.boards);
    if (current) mutate(transform(current));
  };

  return {
    createBoard: (name: string): string => {
      const board = createBoard(name);
      edit((document) => addBoard(document, board));
      return board.id;
    },
    renameBoard: (boardId: string, name: string) => edit((document) => renameBoard(document, boardId, name)),
    removeBoard: (boardId: string) => edit((document) => removeBoard(document, boardId)),
    addTile: (boardId: string, seed: TileSeed) => edit((document) => addTile(document, boardId, seed)),
    removeTile: (boardId: string, tileId: string) => edit((document) => removeTile(document, boardId, tileId)),
    setTileColor: (boardId: string, tileId: string, color: TileColor) =>
      edit((document) => setTileColor(document, boardId, tileId, color)),
    applyLayouts: (boardId: string, layouts: PositionedLayout[]) => edit((document) => applyLayouts(document, boardId, layouts)),
    nudgeTile: (boardId: string, tileId: string, delta: Partial<TileLayout>) =>
      edit((document) => nudgeTile(document, boardId, tileId, delta)),
  };
}
