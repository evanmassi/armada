import { DEFAULT_TERMINAL_FONT_SIZE, type Workspace } from '@shared/workspace/workspaceSchemas';

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 32;

export const adjustTerminalFontSize = (workspace: Workspace, delta: number): Workspace => ({
  ...workspace,
  preferences: {
    ...workspace.preferences,
    terminalFontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, workspace.preferences.terminalFontSize + delta)),
  },
});

export const resetTerminalFontSize = (workspace: Workspace): Workspace => ({
  ...workspace,
  preferences: { ...workspace.preferences, terminalFontSize: DEFAULT_TERMINAL_FONT_SIZE },
});
