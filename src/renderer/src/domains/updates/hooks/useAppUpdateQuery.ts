import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useAppUpdateQuery = () => {
  const queryClient = useQueryClient();

  useEffect(() => armadaClient.updates.onChanged((status) => queryClient.setQueryData(queryKeys.appUpdate, status)), [queryClient]);

  return useQuery({
    queryKey: queryKeys.appUpdate,
    queryFn: () => armadaClient.updates.read(),
    staleTime: Infinity,
  });
};
