export const IPC_CHANNELS = {
  conversationsListProjects: 'conversations:listProjects',
  projectsPickFolder: 'projects:pickFolder',
  workspaceLoad: 'workspace:load',
  workspaceSave: 'workspace:save',
  sessionsOpen: 'sessions:open',
  sessionsWrite: 'sessions:write',
  sessionsResize: 'sessions:resize',
  sessionsClose: 'sessions:close',
  sessionsOutput: 'sessions:output',
  sessionsExit: 'sessions:exit',
  sessionsClaudeHook: 'sessions:claudeHook',
} as const;
