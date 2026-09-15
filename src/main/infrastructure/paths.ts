import { homedir } from 'node:os';
import { join } from 'node:path';
import { app } from 'electron';

export const getClaudeProjectsDir = (): string => join(homedir(), '.claude', 'projects');

export const getWorkspaceFilePath = (): string => join(app.getPath('userData'), 'workspace.json');
