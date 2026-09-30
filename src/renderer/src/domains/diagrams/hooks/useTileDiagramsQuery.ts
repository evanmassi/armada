import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useTileDiagramsQuery = (tileId: string) =>
  useQuery({
    queryKey: queryKeys.tileDiagrams(tileId),
    queryFn: () => armadaClient.diagrams.list({ tileId }),
    staleTime: Infinity,
  });
