import { create } from 'zustand';

interface BoardSelectionState {
  activeBoardId: string | undefined;
  openedBoardIds: string[];
  selectBoard(boardId: string): void;
}

export const useBoardSelectionStore = create<BoardSelectionState>((set) => ({
  activeBoardId: undefined,
  openedBoardIds: [],
  selectBoard: (boardId) =>
    set((state) => ({
      activeBoardId: boardId,
      openedBoardIds: state.openedBoardIds.includes(boardId) ? state.openedBoardIds : [...state.openedBoardIds, boardId],
    })),
}));
