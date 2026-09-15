import { homedir } from 'node:os';
import { join } from 'node:path';
import { app } from 'electron';

export const getClaudeProjectsDir = (): string => join(homedir(), '.claude', 'projects');

export const getBoardsFilePath = (): string => join(app.getPath('userData'), 'boards.json');
