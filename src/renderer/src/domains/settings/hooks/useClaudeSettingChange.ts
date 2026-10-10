import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChangeClaudeSettingRequest } from '@shared/claudeSettings/claudeSettingSchemas';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export function useClaudeSettingChange() {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (request: ChangeClaudeSettingRequest) => armadaClient.claudeSettings.change(request),
    onSuccess: (values) => queryClient.setQueryData(queryKeys.claudeSettings, values),
  });
  return mutate;
}
