import type { Sidebar, SidebarGroup, Workspace } from '@shared/workspace/workspaceSchemas';

export interface ProjectDropTarget {
  groupId: string | undefined;
  beforeCwd?: string;
}

const updateSidebar = (workspace: Workspace, transform: (sidebar: Sidebar) => Sidebar): Workspace => ({
  ...workspace,
  sidebar: transform(workspace.sidebar),
});

const updateGroup = (workspace: Workspace, groupId: string, transform: (group: SidebarGroup) => SidebarGroup): Workspace =>
  updateSidebar(workspace, (sidebar) => ({
    ...sidebar,
    groups: sidebar.groups.map((group) => (group.id === groupId ? transform(group) : group)),
  }));

const without = (list: string[], value: string): string[] => list.filter((item) => item !== value);

const insertBefore = (list: string[], value: string, beforeValue: string | undefined): string[] => {
  const index = beforeValue ? list.indexOf(beforeValue) : -1;
  const next = [...list];
  next.splice(index >= 0 ? index : list.length, 0, value);
  return next;
};

export const moveProject = (workspace: Workspace, cwd: string, target: ProjectDropTarget, otherOrder: string[]): Workspace =>
  updateSidebar(workspace, (sidebar) => {
    const groups = sidebar.groups.map((group) => ({ ...group, projectCwds: without(group.projectCwds, cwd) }));
    const projectOrder = without(otherOrder, cwd);
    return {
      ...sidebar,
      archivedProjectCwds: without(sidebar.archivedProjectCwds, cwd),
      groups: target.groupId
        ? groups.map((group) => (group.id === target.groupId ? { ...group, projectCwds: insertBefore(group.projectCwds, cwd, target.beforeCwd) } : group))
        : groups,
      projectOrder: target.groupId ? projectOrder : insertBefore(projectOrder, cwd, target.beforeCwd),
    };
  });

export const sortSidebarProjects = (workspace: Workspace, compare: (a: string, b: string) => number, otherCwds: string[]): Workspace =>
  updateSidebar(workspace, (sidebar) => ({
    ...sidebar,
    groups: sidebar.groups.map((group) => ({ ...group, projectCwds: [...group.projectCwds].sort(compare) })),
    projectOrder: [...otherCwds].sort(compare),
  }));

export const createSidebarGroup = (workspace: Workspace, name: string): Workspace =>
  updateSidebar(workspace, (sidebar) => ({
    ...sidebar,
    groups: [...sidebar.groups, { id: crypto.randomUUID(), name, projectCwds: [], isCollapsed: false }],
  }));

export const renameSidebarGroup = (workspace: Workspace, groupId: string, name: string): Workspace =>
  updateGroup(workspace, groupId, (group) => ({ ...group, name }));

export const toggleSidebarGroupCollapsed = (workspace: Workspace, groupId: string): Workspace =>
  updateGroup(workspace, groupId, (group) => ({ ...group, isCollapsed: !group.isCollapsed }));

export const removeSidebarGroup = (workspace: Workspace, groupId: string): Workspace =>
  updateSidebar(workspace, (sidebar) => {
    const removed = sidebar.groups.find((group) => group.id === groupId);
    return {
      ...sidebar,
      groups: sidebar.groups.filter((group) => group.id !== groupId),
      projectOrder: [...sidebar.projectOrder, ...(removed?.projectCwds ?? [])],
    };
  });

export const setProjectArchived = (workspace: Workspace, cwd: string, isArchived: boolean): Workspace =>
  updateSidebar(workspace, (sidebar) => ({
    ...sidebar,
    archivedProjectCwds: isArchived ? [...without(sidebar.archivedProjectCwds, cwd), cwd] : without(sidebar.archivedProjectCwds, cwd),
  }));

export const setConversationArchived = (workspace: Workspace, sessionId: string, isArchived: boolean): Workspace =>
  updateSidebar(workspace, (sidebar) => ({
    ...sidebar,
    archivedSessionIds: isArchived ? [...without(sidebar.archivedSessionIds, sessionId), sessionId] : without(sidebar.archivedSessionIds, sessionId),
  }));

export const setProjectAlias = (workspace: Workspace, cwd: string, alias: string | undefined): Workspace =>
  updateSidebar(workspace, (sidebar) => {
    const projectAliases = Object.fromEntries(Object.entries(sidebar.projectAliases).filter(([existing]) => existing !== cwd));
    if (alias) projectAliases[cwd] = alias;
    return { ...sidebar, projectAliases };
  });

export const setSidebarWidth = (workspace: Workspace, width: number): Workspace =>
  updateSidebar(workspace, (sidebar) => ({ ...sidebar, width: Math.round(width) }));
