import { homedir } from 'node:os';
import { join } from 'node:path';
import { app } from 'electron';

export const getHomeDir = (): string => homedir();

export const getClaudeProjectsDir = (): string => join(getHomeDir(), '.claude', 'projects');

export const getClaudeSettingsFilePath = (): string => join(getHomeDir(), '.claude', 'settings.json');

export const getRelayScriptsDir = (): string => join(app.getAppPath(), 'scripts');

export const getWorkspaceFilePath = (): string => join(app.getPath('userData'), 'workspace.json');

export const getClaudeHookInboxDir = (): string => join(app.getPath('userData'), 'claude-hook-inbox');

export const getClaudeUsageFilePath = (): string => join(app.getPath('userData'), 'claude-usage', 'usage.json');

export const getLogFilePath = (): string => join(app.getPath('userData'), 'armada.log');
