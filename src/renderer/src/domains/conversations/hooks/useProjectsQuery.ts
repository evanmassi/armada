import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

const PROJECTS_REFRESH_INTERVAL_MS = 30_000;

export const useProjectsQuery = () =>
  useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => armadaClient.conversations.listProjects(),
    refetchInterval: PROJECTS_REFRESH_INTERVAL_MS,
  });
