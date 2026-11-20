import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { sendToRenderer } from './sendToRenderer';

export function registerIntegrationHandlers({ claudeSettingsFile, claudeFolderTrust, claudeHookInbox, logger }: ServiceContainer, renderer: WebContents): void {
  ipcMain.handle(IPC_CHANNELS.integrationCheck, () => claudeSettingsFile.checkIntegration());
  ipcMain.handle(IPC_CHANNELS.integrationRepair, () => claudeSettingsFile.repairIntegration());
  ipcMain.handle(IPC_CHANNELS.integrationCheckDiagramFolderTrust, () => claudeFolderTrust.check());

  claudeHookInbox.onEvent((event) => {
    if (event.kind !== 'sessionStarted') return;
    claudeFolderTrust
      .check()
      .then((trust) => sendToRenderer(renderer, IPC_CHANNELS.integrationDiagramFolderTrustChanged, trust))
      .catch((error: unknown) => logger.error('folderTrust.checkFailed', { error }));
  });
}
