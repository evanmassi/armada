import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useClaudeUsageQuery = () => {
  const queryClient = useQueryClient();

  useEffect(() => armadaClient.usage.onChanged((usage) => queryClient.setQueryData(queryKeys.usage, usage)), [queryClient]);

  return useQuery({
    queryKey: queryKeys.usage,
    // PITFALL: TanStack Query rejects undefined as query data, and nothing has been reported until a tile's status line first runs.
    queryFn: async () => (await armadaClient.usage.read()) ?? null,
    staleTime: Infinity,
  });
};
