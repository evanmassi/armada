import { z } from 'zod';

export const TILE_COLORS = ['slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'] as const;

export const tileLayoutSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

export const tileSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  cwd: z.string().min(1),
  color: z.enum(TILE_COLORS),
  layout: tileLayoutSchema,
});

export const boardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  tiles: z.array(tileSchema),
});

export const boardsDocumentSchema = z.object({
  boards: z.array(boardSchema),
});

export type TileColor = (typeof TILE_COLORS)[number];
export type TileLayout = z.infer<typeof tileLayoutSchema>;
export type Tile = z.infer<typeof tileSchema>;
export type Board = z.infer<typeof boardSchema>;
export type BoardsDocument = z.infer<typeof boardsDocumentSchema>;
