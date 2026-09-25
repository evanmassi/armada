import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { sendToRenderer } from './sendToRenderer';

export function registerUpdateHandlers({ appUpdater }: ServiceContainer, renderer: WebContents): void {
  ipcMain.handle(IPC_CHANNELS.updatesRead, () => appUpdater.read());
  ipcMain.handle(IPC_CHANNELS.updatesInstall, () => appUpdater.install());

  appUpdater.onChange((status) => sendToRenderer(renderer, IPC_CHANNELS.updatesChanged, status));
}
