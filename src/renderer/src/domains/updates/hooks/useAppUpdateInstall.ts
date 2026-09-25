import { useMutation } from '@tanstack/react-query';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

export function useAppUpdateInstall() {
  const { mutate, isPending } = useMutation({ mutationFn: () => armadaClient.updates.install() });
  return { install: () => mutate(), isInstalling: isPending };
}
