import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import { openLinkRequestSchema } from '@shared/links/linkSchemas';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerLinkHandlers({ linkOpener }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.linksOpen, (_event, payload: unknown) => linkOpener.open(openLinkRequestSchema.parse(payload)));
}
