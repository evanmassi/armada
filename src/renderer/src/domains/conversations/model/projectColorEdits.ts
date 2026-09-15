import type { ProjectColor, Workspace } from '@shared/workspace/workspaceSchemas';

export const setProjectColor = (workspace: Workspace, cwd: string, color: ProjectColor | undefined): Workspace => {
  const projectColors = Object.fromEntries(Object.entries(workspace.projectColors).filter(([existingCwd]) => existingCwd !== cwd));
  if (color) projectColors[cwd] = color;
  return { ...workspace, projectColors };
};
