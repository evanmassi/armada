import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import { folderRequestSchema } from '@shared/projects/projectSchemas';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerProjectHandlers({ folderOpener }: ServiceContainer, mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.projectsPickFolder, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Start a session in a folder',
      properties: ['openDirectory'],
    });
    return canceled ? undefined : filePaths[0];
  });
  ipcMain.handle(IPC_CHANNELS.projectsReveal, (_event, payload: unknown) =>
    folderOpener.revealInFileManager(folderRequestSchema.parse(payload).cwd),
  );
  ipcMain.handle(IPC_CHANNELS.projectsOpenInEditor, (_event, payload: unknown) =>
    folderOpener.openInEditor(folderRequestSchema.parse(payload).cwd),
  );
}
