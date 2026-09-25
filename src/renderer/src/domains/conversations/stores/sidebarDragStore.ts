import { create } from 'zustand';

interface SidebarDragState {
  draggingCwd: string | undefined;
  draggingGroupId: string | undefined;
  beginProjectDrag(cwd: string): void;
  beginGroupDrag(groupId: string): void;
  endDrag(): void;
}

export const useSidebarDragStore = create<SidebarDragState>((set) => ({
  draggingCwd: undefined,
  draggingGroupId: undefined,
  beginProjectDrag: (cwd) => set({ draggingCwd: cwd, draggingGroupId: undefined }),
  beginGroupDrag: (groupId) => set({ draggingCwd: undefined, draggingGroupId: groupId }),
  endDrag: () => set({ draggingCwd: undefined, draggingGroupId: undefined }),
}));

export const selectIsSidebarDragging = (state: SidebarDragState): boolean =>
  state.draggingCwd !== undefined || state.draggingGroupId !== undefined;
