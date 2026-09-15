import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export type WorkspaceEdit = (workspace: Workspace) => Workspace;

export function useWorkspaceEditor() {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (workspace: Workspace) => armadaClient.workspace.save(workspace),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
  });

  // PITFALL: the cache is written here, not in onMutate, so two edits in the same tick see each other's result.
  const edit = (transform: WorkspaceEdit): void => {
    const current = queryClient.getQueryData<Workspace>(queryKeys.workspace);
    if (!current) return;
    const next = transform(current);
    if (next === current) return;
    queryClient.setQueryData(queryKeys.workspace, next);
    mutate(next);
  };

  return { edit };
}
