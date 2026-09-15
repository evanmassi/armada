import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import { workspaceSchema } from '@shared/workspace/workspaceSchemas';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerWorkspaceHandlers({ workspaceRepository }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.workspaceLoad, () => workspaceRepository.load());
  ipcMain.handle(IPC_CHANNELS.workspaceSave, (_event, payload: unknown) =>
    workspaceRepository.save(workspaceSchema.parse(payload)),
  );
}
