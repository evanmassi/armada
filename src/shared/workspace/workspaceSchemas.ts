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

export const DEFAULT_TERMINAL_FONT_SIZE = 13;

export const projectColorSchema = z.enum(PROJECT_COLORS);

export const layoutModeSchema = z.enum(LAYOUT_MODES);

export const tileLayoutSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

const tileBaseSchema = z.object({
  id: z.string().uuid(),
  layout: tileLayoutSchema,
  weight: z.number().positive().default(1),
});

const claudeTileSchema = tileBaseSchema.extend({
  kind: z.literal('claude'),
  sessionId: z.string().uuid(),
  cwd: z.string().min(1),
});

const shellTileSchema = tileBaseSchema.extend({
  kind: z.literal('shell'),
  cwd: z.string().min(1),
});

const notesTileSchema = tileBaseSchema.extend({
  kind: z.literal('notes'),
  text: z.string(),
});

// PITFALL: workspace files written before tile kinds existed have no "kind"; they are all Claude tiles.
const defaultTileKindToClaude = (value: unknown): unknown =>
  value !== null && typeof value === 'object' && !('kind' in value) ? { ...value, kind: 'claude' } : value;

export const tileSchema = z.preprocess(
  defaultTileKindToClaude,
  z.discriminatedUnion('kind', [claudeTileSchema, shellTileSchema, notesTileSchema]),
);

export const boardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  projectCwd: z.string().min(1).optional(),
  layoutMode: layoutModeSchema.default('auto'),
  rowWeights: z.array(z.number().positive()).default([]),
  tiles: z.array(tileSchema),
});

export const preferencesSchema = z.object({
  terminalFontSize: z.number().int().min(8).max(32).default(DEFAULT_TERMINAL_FONT_SIZE),
});

export const sidebarGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  projectCwds: z.array(z.string().min(1)),
  isCollapsed: z.boolean().default(false),
});

export const sidebarSchema = z.object({
  width: z.number().int().min(200).max(640).default(288),
  groups: z.array(sidebarGroupSchema).default([]),
  projectOrder: z.array(z.string().min(1)).default([]),
  archivedProjectCwds: z.array(z.string().min(1)).default([]),
  archivedSessionIds: z.array(z.string().uuid()).default([]),
  projectAliases: z.record(z.string().min(1), z.string().min(1)).default({}),
});

export const workspaceSchema = z.object({
  boards: z.array(boardSchema),
  projectColors: z.record(z.string().min(1), projectColorSchema),
  pinnedSessionIds: z.array(z.string().uuid()).default([]),
  preferences: preferencesSchema.default({}),
  sidebar: sidebarSchema.default({}),
});

export type ProjectColor = z.infer<typeof projectColorSchema>;
export type LayoutMode = z.infer<typeof layoutModeSchema>;
export type TileLayout = z.infer<typeof tileLayoutSchema>;
export type ClaudeTile = z.infer<typeof claudeTileSchema>;
export type ShellTile = z.infer<typeof shellTileSchema>;
export type NotesTile = z.infer<typeof notesTileSchema>;
export type Tile = z.infer<typeof tileSchema>;
export type TileKind = Tile['kind'];
export type Board = z.infer<typeof boardSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SidebarGroup = z.infer<typeof sidebarGroupSchema>;
export type Sidebar = z.infer<typeof sidebarSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
