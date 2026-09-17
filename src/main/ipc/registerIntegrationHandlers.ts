import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerIntegrationHandlers({ claudeSettingsFile }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.integrationCheck, () => claudeSettingsFile.checkIntegration());
  ipcMain.handle(IPC_CHANNELS.integrationRepair, () => claudeSettingsFile.repairIntegration());
}
