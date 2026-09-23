export const queryKeys = {
  projects: ['projects'] as const,
  workspace: ['workspace'] as const,
  usage: ['usage'] as const,
  integration: ['integration'] as const,
  projectLineChanges: (cwd: string) => ['projectLineChanges', cwd] as const,
};
