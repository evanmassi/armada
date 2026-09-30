import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DiagramSummary } from '@shared/diagrams/diagramSchemas';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';

type DiagramArrivalHandler = (tileId: string, fileName: string) => void;

const latestUpdate = (diagrams: DiagramSummary[] | undefined): number => Math.max(0, ...(diagrams ?? []).map((diagram) => diagram.updatedAt));

export function useTileDiagramArrivals(onArrival: DiagramArrivalHandler): void {
  const queryClient = useQueryClient();
  const onArrivalRef = useRef(onArrival);
  onArrivalRef.current = onArrival;

  useEffect(
    () =>
      armadaClient.diagrams.onChanged(({ tileId, diagrams }) => {
        const queryKey = queryKeys.tileDiagrams(tileId);
        const previous = queryClient.getQueryData<DiagramSummary[]>(queryKey);
        queryClient.setQueryData(queryKey, diagrams);
        const newest = diagrams.at(-1);
        if (newest && newest.updatedAt > latestUpdate(previous)) onArrivalRef.current(tileId, newest.fileName);
      }),
    [queryClient],
  );
}
