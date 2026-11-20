export type ClaudeIntegrationGap = 'hooks' | 'statusLine';

export interface ClaudeIntegrationStatus {
  gaps: ClaudeIntegrationGap[];
  isNodeAvailable: boolean;
  settingsPath: string;
}

export interface DiagramFolderTrust {
  folder: string;
  isTrusted: boolean;
}
