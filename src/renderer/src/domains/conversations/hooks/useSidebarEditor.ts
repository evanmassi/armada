import { useWorkspaceEditor } from '@renderer/domains/workspace';
import {
  createSidebarGroup,
  moveProject,
  removeSidebarGroup,
  renameSidebarGroup,
  setConversationArchived,
  setProjectAlias,
  setProjectArchived,
  setSidebarWidth,
  sortSidebarProjects,
  toggleSidebarGroupCollapsed,
  type ProjectDropTarget,
} from '../model/sidebarEdits';

export function useSidebarEditor() {
  const { edit } = useWorkspaceEditor();
  return {
    moveProject: (cwd: string, target: ProjectDropTarget, otherOrder: string[]) =>
      edit((workspace) => moveProject(workspace, cwd, target, otherOrder)),
    sortProjects: (compare: (a: string, b: string) => number, otherCwds: string[]) =>
      edit((workspace) => sortSidebarProjects(workspace, compare, otherCwds)),
    createGroup: (name: string) => edit((workspace) => createSidebarGroup(workspace, name)),
    renameGroup: (groupId: string, name: string) => edit((workspace) => renameSidebarGroup(workspace, groupId, name)),
    toggleGroupCollapsed: (groupId: string) => edit((workspace) => toggleSidebarGroupCollapsed(workspace, groupId)),
    removeGroup: (groupId: string) => edit((workspace) => removeSidebarGroup(workspace, groupId)),
    setProjectArchived: (cwd: string, isArchived: boolean) => edit((workspace) => setProjectArchived(workspace, cwd, isArchived)),
    setConversationArchived: (sessionId: string, isArchived: boolean) =>
      edit((workspace) => setConversationArchived(workspace, sessionId, isArchived)),
    setProjectAlias: (cwd: string, alias: string | undefined) => edit((workspace) => setProjectAlias(workspace, cwd, alias)),
    setWidth: (width: number) => edit((workspace) => setSidebarWidth(workspace, width)),
  };
}
