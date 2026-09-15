import type { ProjectColor } from '@shared/workspace/workspaceSchemas';
import { useWorkspaceEditor, useWorkspaceQuery } from '@renderer/domains/workspace';
import { setProjectColor } from '../model/projectColorEdits';
import { PROJECT_COLOR_VALUES, UNCOLORED_ACCENT } from '../ui/projectColorValues';

export function useProjectColors() {
  const { data: workspace } = useWorkspaceQuery();
  const { edit } = useWorkspaceEditor();
  const colors = workspace?.projectColors ?? {};
  return {
    colorOf: (cwd: string): ProjectColor | undefined => colors[cwd],
    setColor: (cwd: string, color: ProjectColor | undefined) => edit((current) => setProjectColor(current, cwd, color)),
  };
}

export function useProjectAccents(): (cwd: string) => string {
  const { colorOf } = useProjectColors();
  return (cwd) => {
    const color = colorOf(cwd);
    return color ? PROJECT_COLOR_VALUES[color] : UNCOLORED_ACCENT;
  };
}
