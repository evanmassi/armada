import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { sendToRenderer } from './sendToRenderer';

export function registerUsageHandlers({ claudeUsageService }: ServiceContainer, renderer: WebContents): void {
  ipcMain.handle(IPC_CHANNELS.usageRead, () => claudeUsageService.read());

  claudeUsageService.onChange((usage) => sendToRenderer(renderer, IPC_CHANNELS.usageChanged, usage));
}
