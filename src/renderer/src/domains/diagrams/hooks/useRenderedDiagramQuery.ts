import { queryOptions, useQuery } from '@tanstack/react-query';
import type { DiagramSummary } from '@shared/diagrams/diagramSchemas';
import { queryKeys } from '@renderer/app/queryKeys';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { renderMermaid } from '../model/mermaidRenderer';

export const renderedDiagramQueryOptions = (tileId: string, { fileName, format, updatedAt }: DiagramSummary) =>
  queryOptions({
    queryKey: queryKeys.renderedDiagram(tileId, fileName, updatedAt),
    queryFn: async () => {
      const source = await armadaClient.diagrams.read({ tileId, fileName });
      return format === 'mermaid' ? renderMermaid(source) : source;
    },
    staleTime: Infinity,
    retry: false,
  });

export const useRenderedDiagramQuery = (tileId: string, diagram: DiagramSummary) => useQuery(renderedDiagramQueryOptions(tileId, diagram));
