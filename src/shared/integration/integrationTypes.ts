export type ClaudeIntegrationGap = 'hooks' | 'statusLine';

export interface ClaudeIntegrationStatus {
  gaps: ClaudeIntegrationGap[];
}
