import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DiagramSummary } from '@shared/diagrams/diagramSchemas';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { readDesignToken } from '@renderer/shared/utils/readDesignToken';
import { withBackground } from '../model/diagramSvg';
import { renderedDiagramQueryOptions } from './useRenderedDiagramQuery';

export function useDiagramSave(tileId: string) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (diagram: DiagramSummary) => {
      const rendered = await queryClient.ensureQueryData(renderedDiagramQueryOptions(tileId, diagram));
      const content = diagram.format === 'mermaid' ? withBackground(rendered, readDesignToken('--color-tile')) : rendered;
      return armadaClient.diagrams.save({ fileName: diagram.fileName, content });
    },
  });
  return { save: (diagram: DiagramSummary) => mutate(diagram), isSaving: isPending };
}
