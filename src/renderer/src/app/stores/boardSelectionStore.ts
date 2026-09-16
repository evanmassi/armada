import { create } from 'zustand';

interface BoardSelectionState {
  activeBoardId: string | undefined;
  openedBoardIds: string[];
  focusedTileId: string | undefined;
  selectBoard(boardId: string): void;
  focusTile(boardId: string, tileId: string): void;
  setFocusedTile(tileId: string | undefined): void;
}

const withBoardOpened = (openedBoardIds: string[], boardId: string): string[] =>
  openedBoardIds.includes(boardId) ? openedBoardIds : [...openedBoardIds, boardId];

export const useBoardSelectionStore = create<BoardSelectionState>((set) => ({
  activeBoardId: undefined,
  openedBoardIds: [],
  focusedTileId: undefined,
  selectBoard: (boardId) =>
    set((state) => ({ activeBoardId: boardId, openedBoardIds: withBoardOpened(state.openedBoardIds, boardId), focusedTileId: undefined })),
  focusTile: (boardId, tileId) =>
    set((state) => ({
      activeBoardId: boardId,
      openedBoardIds: withBoardOpened(state.openedBoardIds, boardId),
      focusedTileId: tileId,
    })),
  setFocusedTile: (tileId) => set({ focusedTileId: tileId }),
}));
