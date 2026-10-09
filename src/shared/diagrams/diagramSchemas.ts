import { z } from 'zod';

export const DIAGRAM_PAGE_SCHEME = 'armada-diagram';

export const DIAGRAM_PAGE_ESCAPE_MESSAGE = 'armada-diagram:escape';

export const DIAGRAM_PAGE_LINK_MESSAGE_PREFIX = 'armada-diagram:link ';

const diagramFileNameSchema = z.string().regex(/^[\w-][\w.-]*\.(mmd|svg|html)$/i);

export const tileDiagramsRequestSchema = z.object({
  tileId: z.string().uuid(),
});

export const diagramRefSchema = tileDiagramsRequestSchema.extend({
  fileName: diagramFileNameSchema,
});

export const saveDiagramRequestSchema = z.object({
  fileName: diagramFileNameSchema,
  content: z.string().min(1),
});

export type TileDiagramsRequest = z.infer<typeof tileDiagramsRequestSchema>;
export type DiagramRef = z.infer<typeof diagramRefSchema>;
export type SaveDiagramRequest = z.infer<typeof saveDiagramRequestSchema>;

export type DiagramFormat = 'mermaid' | 'svg' | 'html';

export interface DiagramSummary {
  fileName: string;
  format: DiagramFormat;
  updatedAt: number;
}

export interface TileDiagramsChangedEvent {
  tileId: string;
  diagrams: DiagramSummary[];
}
