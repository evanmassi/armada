import {
  DEFAULT_TERMINAL_FONT_SIZE,
  MAX_TERMINAL_FONT_SIZE,
  MIN_TERMINAL_FONT_SIZE,
  type Workspace,
} from '@shared/workspace/workspaceSchemas';

export const adjustTerminalFontSize = (workspace: Workspace, delta: number): Workspace => ({
  ...workspace,
  preferences: {
    ...workspace.preferences,
    terminalFontSize: Math.min(MAX_TERMINAL_FONT_SIZE, Math.max(MIN_TERMINAL_FONT_SIZE, workspace.preferences.terminalFontSize + delta)),
  },
});

export const resetTerminalFontSize = (workspace: Workspace): Workspace => ({
  ...workspace,
  preferences: { ...workspace.preferences, terminalFontSize: DEFAULT_TERMINAL_FONT_SIZE },
});
