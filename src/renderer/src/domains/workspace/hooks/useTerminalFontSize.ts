import { DEFAULT_TERMINAL_FONT_SIZE } from '@shared/workspace/workspaceSchemas';
import { useWorkspaceQuery } from './useWorkspaceQuery';

export const useTerminalFontSize = (): number =>
  useWorkspaceQuery().data?.preferences.terminalFontSize ?? DEFAULT_TERMINAL_FONT_SIZE;
