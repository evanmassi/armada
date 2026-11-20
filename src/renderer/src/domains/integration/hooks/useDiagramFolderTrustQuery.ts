import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useDiagramFolderTrustQuery = () => {
  const queryClient = useQueryClient();

  useEffect(
    () => armadaClient.integration.onDiagramFolderTrustChanged((trust) => queryClient.setQueryData(queryKeys.diagramFolderTrust, trust)),
    [queryClient],
  );

  return useQuery({
    queryKey: queryKeys.diagramFolderTrust,
    queryFn: () => armadaClient.integration.checkDiagramFolderTrust(),
    staleTime: Infinity,
  });
};
