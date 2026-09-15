import { useWorkspaceEditor, useWorkspaceQuery } from '@renderer/domains/workspace';
import { ensureProjectColor, setProjectColor } from '../model/projectColorEdits';
import { UNCOLORED_ACCENT } from '../ui/projectColorPalette';

export function useProjectColors() {
  const { data: workspace } = useWorkspaceQuery();
  const { edit } = useWorkspaceEditor();
  const colors = workspace?.projectColors ?? {};
  return {
    colorOf: (cwd: string): string | undefined => colors[cwd],
    setColor: (cwd: string, color: string | undefined) => edit((current) => setProjectColor(current, cwd, color)),
    ensureColor: (cwd: string) => edit((current) => ensureProjectColor(current, cwd)),
  };
}

export function useProjectAccents(): (cwd: string | undefined) => string {
  const { colorOf } = useProjectColors();
  return (cwd) => (cwd ? colorOf(cwd) : undefined) ?? UNCOLORED_ACCENT;
}
