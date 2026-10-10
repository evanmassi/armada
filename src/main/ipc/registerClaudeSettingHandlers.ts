import { ipcMain } from 'electron';
import { changeClaudeSettingRequestSchema } from '@shared/claudeSettings/claudeSettingSchemas';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerClaudeSettingHandlers({ claudeSettingsFile }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.claudeSettingsRead, () => claudeSettingsFile.readSettingValues());
  ipcMain.handle(IPC_CHANNELS.claudeSettingsChange, (_event, payload: unknown) =>
    claudeSettingsFile.changeSetting(changeClaudeSettingRequestSchema.parse(payload)),
  );
}
