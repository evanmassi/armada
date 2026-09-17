import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { useNotificationStore } from '@renderer/app/stores/notificationStore';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

const REPAIRED_NOTICE = 'Connected to Claude Code. Sessions already running pick it up once restarted.';

export function useIntegrationRepair() {
  const queryClient = useQueryClient();
  const notify = useNotificationStore((state) => state.notify);
  const { mutate, isPending } = useMutation({
    mutationFn: () => armadaClient.integration.repair(),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.integration, status);
      if (status.gaps.length === 0) notify(REPAIRED_NOTICE);
    },
  });
  return { repair: () => mutate(), isRepairing: isPending };
}
