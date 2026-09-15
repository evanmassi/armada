import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerConversationHandlers({ conversationCatalogService }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.conversationsListProjects, () => conversationCatalogService.listProjects());
}
