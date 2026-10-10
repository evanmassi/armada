import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export const useClaudeSettingsQuery = () =>
  useQuery({
    queryKey: queryKeys.claudeSettings,
    queryFn: () => armadaClient.claudeSettings.read(),
  });
