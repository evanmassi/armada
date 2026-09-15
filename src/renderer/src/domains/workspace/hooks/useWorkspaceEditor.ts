import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export type WorkspaceEdit = (workspace: Workspace) => Workspace;

export function useWorkspaceEditor() {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (workspace: Workspace) => armadaClient.workspace.save(workspace),
    onMutate: (workspace) => queryClient.setQueryData(queryKeys.workspace, workspace),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
  });

  const edit = (transform: WorkspaceEdit): void => {
    const current = queryClient.getQueryData<Workspace>(queryKeys.workspace);
    if (current) mutate(transform(current));
  };

  return { edit };
}
