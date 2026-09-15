import { MutationCache, QueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@renderer/app/stores/notificationStore';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
  mutationCache: new MutationCache({
    onError: (error) => useNotificationStore.getState().notify(getErrorMessage(error)),
  }),
});
