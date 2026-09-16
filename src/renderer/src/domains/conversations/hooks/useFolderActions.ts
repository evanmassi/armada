import { useMutation } from '@tanstack/react-query';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export function useFolderActions() {
  const reveal = useMutation({ mutationFn: (cwd: string) => armadaClient.projects.reveal({ cwd }) });
  const openInEditor = useMutation({ mutationFn: (cwd: string) => armadaClient.projects.openInEditor({ cwd }) });
  return {
    revealInExplorer: (cwd: string) => reveal.mutate(cwd),
    openInEditor: (cwd: string) => openInEditor.mutate(cwd),
  };
}
