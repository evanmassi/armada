import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useProjectLineChangesQuery = (cwd: string) => {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      armadaClient.sessions.onClaudeHookEvent((event) => {
        if (event.kind === 'turnEnded') void queryClient.invalidateQueries({ queryKey: queryKeys.projectLineChanges(cwd) });
      }),
    [cwd, queryClient],
  );

  return useQuery({
    queryKey: queryKeys.projectLineChanges(cwd),
    // PITFALL: TanStack Query rejects undefined as query data, and a folder outside git has no count.
    queryFn: async () => (await armadaClient.projects.countLineChanges({ cwd })) ?? null,
  });
};
