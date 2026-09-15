import { z } from 'zod';

export const PROJECT_COLORS = [
  'slate',
  'stone',
  'red',
  'rose',
  'pink',
  'fuchsia',
  'purple',
  'violet',
  'indigo',
  'blue',
  'sky',
  'cyan',
  'teal',
  'emerald',
  'green',
  'lime',
  'yellow',
  'amber',
  'orange',
] as const;

export const LAYOUT_MODES = ['auto', 'free'] as const;

export const projectColorSchema = z.enum(PROJECT_COLORS);

export const layoutModeSchema = z.enum(LAYOUT_MODES);

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
  layout: tileLayoutSchema,
  weight: z.number().positive().default(1),
});

export const boardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  layoutMode: layoutModeSchema.default('auto'),
  rowWeights: z.array(z.number().positive()).default([]),
  tiles: z.array(tileSchema),
});

export const workspaceSchema = z.object({
  boards: z.array(boardSchema),
  projectColors: z.record(z.string().min(1), projectColorSchema),
});

export type ProjectColor = z.infer<typeof projectColorSchema>;
export type LayoutMode = z.infer<typeof layoutModeSchema>;
export type TileLayout = z.infer<typeof tileLayoutSchema>;
export type Tile = z.infer<typeof tileSchema>;
export type Board = z.infer<typeof boardSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
