import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerFileHandlers({ clipboardImageSaver }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.filesSaveClipboardImage, () => clipboardImageSaver.save());
}
