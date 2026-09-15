import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useWorkspaceQuery = () =>
  useQuery({
    queryKey: queryKeys.workspace,
    queryFn: () => armadaClient.workspace.load(),
    staleTime: Infinity,
  });
