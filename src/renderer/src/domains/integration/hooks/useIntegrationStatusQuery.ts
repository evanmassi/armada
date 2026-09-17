import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useIntegrationStatusQuery = () =>
  useQuery({
    queryKey: queryKeys.integration,
    queryFn: () => armadaClient.integration.check(),
  });
