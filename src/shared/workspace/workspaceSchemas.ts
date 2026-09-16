import { z } from 'zod';

const LEGACY_PROJECT_COLOR_VALUES: Record<string, string> = {
  slate: '#64748b',
  stone: '#78716c',
  red: '#ef4444',
  rose: '#f43f5e',
  pink: '#ec4899',
  fuchsia: '#d946ef',
  purple: '#a855f7',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  blue: '#3b82f6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  emerald: '#10b981',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#eab308',
  amber: '#f59e0b',
  orange: '#f97316',
};

export const LAYOUT_MODES = ['auto', 'free'] as const;

export const DEFAULT_TERMINAL_FONT_SIZE = 13;

// PITFALL: workspace files from before free colors store Tailwind hue names; they map to their old hex here.
const legacyColorNameToHex = (value: unknown): unknown =>
  typeof value === 'string' ? (LEGACY_PROJECT_COLOR_VALUES[value] ?? value) : value;

export const projectColorSchema = z.preprocess(legacyColorNameToHex, z.string().regex(/^#[0-9a-f]{6}$/i));

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
  cwd: z.string().min(1).optional(),
});

// PITFALL: workspace files written before tile kinds existed have no "kind"; they are all Claude tiles.
const defaultTileKindToClaude = (value: unknown): unknown =>
  value !== null && typeof value === 'object' && !('kind' in value) ? { ...value, kind: 'claude' } : value;

export const tileSchema = z.preprocess(
  defaultTileKindToClaude,
  z.discriminatedUnion('kind', [claudeTileSchema, shellTileSchema, notesTileSchema]),
);

export const laneStateSchema = z.object({
  weight: z.number().positive().default(1),
  isCollapsed: z.boolean().default(false),
});

export const boardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  projectCwd: z.string().min(1).optional(),
  layoutMode: layoutModeSchema.default('auto'),
  rowWeights: z.array(z.number().positive()).default([]),
  lanes: z.record(z.string().min(1), laneStateSchema).default({}),
  laneOrder: z.array(z.string().min(1)).default([]),
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
  projectExpansion: z.record(z.string().min(1), z.boolean()).default({}),
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
export type LaneState = z.infer<typeof laneStateSchema>;
export type Board = z.infer<typeof boardSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SidebarGroup = z.infer<typeof sidebarGroupSchema>;
export type Sidebar = z.infer<typeof sidebarSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
