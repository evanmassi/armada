import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useBoardsQuery = () =>
  useQuery({
    queryKey: queryKeys.boards,
    queryFn: () => armadaClient.boards.load(),
    staleTime: Infinity,
  });
