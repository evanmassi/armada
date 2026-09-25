import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerUpdateHandlers({ appUpdater }: ServiceContainer, renderer: WebContents): void {
  ipcMain.handle(IPC_CHANNELS.updatesRead, () => appUpdater.read());
  ipcMain.handle(IPC_CHANNELS.updatesInstall, () => appUpdater.install());

  appUpdater.onChange((status) => {
    if (renderer.isDestroyed()) return;
    renderer.send(IPC_CHANNELS.updatesChanged, status);
  });
}
