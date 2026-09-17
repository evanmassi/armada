import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ClaudeUsage } from '@shared/usage/usageSchemas';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerUsageHandlers({ claudeUsageFile }: ServiceContainer, renderer: WebContents): void {
  ipcMain.handle(IPC_CHANNELS.usageRead, () => claudeUsageFile.read());

  claudeUsageFile.onChange((usage: ClaudeUsage) => {
    if (renderer.isDestroyed()) return;
    renderer.send(IPC_CHANNELS.usageChanged, usage);
  });
}
