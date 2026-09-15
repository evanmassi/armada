import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { AUTO_ASSIGN_ORDER } from '../ui/projectColorPalette';

const normalize = (color: string): string => color.toLowerCase();

export const setProjectColor = (workspace: Workspace, cwd: string, color: string | undefined): Workspace => {
  const projectColors = Object.fromEntries(Object.entries(workspace.projectColors).filter(([existingCwd]) => existingCwd !== cwd));
  if (color) projectColors[cwd] = normalize(color);
  return { ...workspace, projectColors };
};

export const pickUnusedProjectColor = (usedColors: string[]): string => {
  const used = new Set(usedColors.map(normalize));
  return AUTO_ASSIGN_ORDER.find((color) => !used.has(color)) ?? AUTO_ASSIGN_ORDER[usedColors.length % AUTO_ASSIGN_ORDER.length]!;
};

export const ensureProjectColor = (workspace: Workspace, cwd: string): Workspace =>
  cwd in workspace.projectColors
    ? workspace
    : setProjectColor(workspace, cwd, pickUnusedProjectColor(Object.values(workspace.projectColors)));
