import { MutationCache, QueryClient } from '@tanstack/react-query';
import { notifyError } from '@renderer/app/stores/notificationStore';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
  mutationCache: new MutationCache({
    onError: notifyError,
  }),
});
