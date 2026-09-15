import type { ProjectColor } from '@shared/workspace/workspaceSchemas';
import { useWorkspaceEditor, useWorkspaceQuery } from '@renderer/domains/workspace';
import { ensureProjectColor, setProjectColor } from '../model/projectColorEdits';
import { PROJECT_COLOR_VALUES, UNCOLORED_ACCENT } from '../ui/projectColorValues';

export function useProjectColors() {
  const { data: workspace } = useWorkspaceQuery();
  const { edit } = useWorkspaceEditor();
  const colors = workspace?.projectColors ?? {};
  return {
    colorOf: (cwd: string): ProjectColor | undefined => colors[cwd],
    setColor: (cwd: string, color: ProjectColor | undefined) => edit((current) => setProjectColor(current, cwd, color)),
    ensureColor: (cwd: string) => edit((current) => ensureProjectColor(current, cwd)),
  };
}

export function useProjectAccents(): (cwd: string | undefined) => string {
  const { colorOf } = useProjectColors();
  return (cwd) => {
    const color = cwd ? colorOf(cwd) : undefined;
    return color ? PROJECT_COLOR_VALUES[color] : UNCOLORED_ACCENT;
  };
}
