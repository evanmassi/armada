import { homedir } from 'node:os';
import { join } from 'node:path';
import { app } from 'electron';

export const getHomeDir = (): string => homedir();

export const getClaudeProjectsDir = (): string => join(getHomeDir(), '.claude', 'projects');

export const getClaudeSettingsFilePath = (): string => join(getHomeDir(), '.claude', 'settings.json');

const DEV_DATA_FOLDER = 'armada-dev';

export const separateDevDataFolder = (): void => {
  if (!app.isPackaged) app.setPath('userData', join(app.getPath('appData'), DEV_DATA_FOLDER));
};

export const getBundledRelayScriptsDir = (): string => join(app.getAppPath(), 'scripts');

export const getInstalledRelayScriptsDir = (): string => join(app.getPath('appData'), 'armada-relays');

export const getWorkspaceFilePath = (): string => join(app.getPath('userData'), 'workspace.json');

export const getClaudeHookInboxDir = (): string => join(app.getPath('userData'), 'claude-hook-inbox');

export const getClaudeUsageFilePath = (): string => join(app.getPath('userData'), 'claude-usage', 'usage.json');

export const getClaudeSessionStatusDir = (): string => join(app.getPath('userData'), 'claude-session-status');

export const getClipboardImagesDir = (): string => join(app.getPath('userData'), 'clipboard-images');

export const getLogFilePath = (): string => join(app.getPath('userData'), 'armada.log');
