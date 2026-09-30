export const queryKeys = {
  projects: ['projects'] as const,
  workspace: ['workspace'] as const,
  usage: ['usage'] as const,
  integration: ['integration'] as const,
  appUpdate: ['appUpdate'] as const,
  projectLineChanges: (cwd: string) => ['projectLineChanges', cwd] as const,
  tileDiagrams: (tileId: string) => ['tileDiagrams', tileId] as const,
  renderedDiagram: (tileId: string, fileName: string, updatedAt: number) => ['renderedDiagram', tileId, fileName, updatedAt] as const,
};
