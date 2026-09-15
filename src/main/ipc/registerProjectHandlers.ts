import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';

export function registerProjectHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.projectsPickFolder, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Start a session in a folder',
      properties: ['openDirectory'],
    });
    return canceled ? undefined : filePaths[0];
  });
}
