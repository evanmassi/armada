import { useMemo } from 'react';
import { useProjectsQuery } from './useProjectsQuery';

export function useConversationTitles(): Map<string, string> {
  const { data: projects = [] } = useProjectsQuery();
  return useMemo(
    () =>
      new Map(
        projects.flatMap((project) =>
          project.conversations.map((conversation) => [conversation.sessionId, conversation.title] as const),
        ),
      ),
    [projects],
  );
}
