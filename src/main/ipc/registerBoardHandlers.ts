import { ipcMain } from 'electron';
import { boardsDocumentSchema } from '@shared/boards/boardSchemas';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerBoardHandlers({ boardRepository }: ServiceContainer): void {
  ipcMain.handle(IPC_CHANNELS.boardsLoad, () => boardRepository.load());
  ipcMain.handle(IPC_CHANNELS.boardsSave, (_event, payload: unknown) =>
    boardRepository.save(boardsDocumentSchema.parse(payload)),
  );
}
