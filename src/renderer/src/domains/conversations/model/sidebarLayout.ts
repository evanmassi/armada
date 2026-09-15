import type { Project } from '@shared/conversations/conversationTypes';
import type { Sidebar, SidebarGroup } from '@shared/workspace/workspaceSchemas';

export type SidebarSectionKind = 'group' | 'other' | 'archived';

export interface SidebarSection {
  key: string;
  kind: SidebarSectionKind;
  group: SidebarGroup | undefined;
  projects: Project[];
}

const OTHER_SECTION_KEY = 'other';
const ARCHIVED_SECTION_KEY = 'archived';

const latestActivity = (project: Project): string => project.conversations[0]?.lastActiveAt ?? '';

export const byMostRecentProject = (a: Project, b: Project): number => latestActivity(b).localeCompare(latestActivity(a));

export function arrangeSidebar(projects: Project[], sidebar: Sidebar): SidebarSection[] {
  const byCwd = new Map(projects.map((project) => [project.cwd, project]));
  const placed = new Set<string>();
  const take = (cwd: string): Project[] => {
    const project = byCwd.get(cwd);
    if (!project || placed.has(cwd)) return [];
    placed.add(cwd);
    return [project];
  };

  const archived = sidebar.archivedProjectCwds.flatMap(take);
  const groups: SidebarSection[] = sidebar.groups.map((group) => ({
    key: group.id,
    kind: 'group',
    group,
    projects: group.projectCwds.flatMap(take),
  }));
  const ordered = sidebar.projectOrder.flatMap(take);
  const unplaced = projects.filter((project) => !placed.has(project.cwd)).sort(byMostRecentProject);
  const other = [...ordered, ...unplaced];

  return [
    ...groups,
    ...(other.length > 0 ? [{ key: OTHER_SECTION_KEY, kind: 'other' as const, group: undefined, projects: other }] : []),
    ...(archived.length > 0 ? [{ key: ARCHIVED_SECTION_KEY, kind: 'archived' as const, group: undefined, projects: archived }] : []),
  ];
}
