import { PROJECT_COLORS, type ProjectColor, type Workspace } from '@shared/workspace/workspaceSchemas';

const GREYS: ProjectColor[] = ['slate', 'stone'];
const AUTO_COLOR_ORDER: ProjectColor[] = [...PROJECT_COLORS.filter((color) => !GREYS.includes(color)), ...GREYS];

export const setProjectColor = (workspace: Workspace, cwd: string, color: ProjectColor | undefined): Workspace => {
  const projectColors = Object.fromEntries(Object.entries(workspace.projectColors).filter(([existingCwd]) => existingCwd !== cwd));
  if (color) projectColors[cwd] = color;
  return { ...workspace, projectColors };
};

export const pickUnusedProjectColor = (usedColors: ProjectColor[]): ProjectColor => {
  const unused = AUTO_COLOR_ORDER.find((color) => !usedColors.includes(color));
  return unused ?? AUTO_COLOR_ORDER[usedColors.length % AUTO_COLOR_ORDER.length]!;
};

export const ensureProjectColor = (workspace: Workspace, cwd: string): Workspace =>
  cwd in workspace.projectColors
    ? workspace
    : setProjectColor(workspace, cwd, pickUnusedProjectColor(Object.values(workspace.projectColors)));
