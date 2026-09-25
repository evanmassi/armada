import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import {
  openSessionRequestSchema,
  terminalRefSchema,
  terminalResizeRequestSchema,
  terminalWriteRequestSchema,
  type TerminalExitEvent,
  type TerminalOutputEvent,
} from '@shared/sessions/sessionSchemas';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { sendToRenderer } from './sendToRenderer';

export function registerSessionHandlers({ sessionService, terminalHost, claudeHookInbox, claudeSessionStatusFiles }: ServiceContainer, renderer: WebContents): void {
  ipcMain.handle(IPC_CHANNELS.sessionsOpen, (_event, payload: unknown) =>
    sessionService.open(openSessionRequestSchema.parse(payload)),
  );
  ipcMain.on(IPC_CHANNELS.sessionsWrite, (_event, payload: unknown) => {
    const { terminalId, data } = terminalWriteRequestSchema.parse(payload);
    terminalHost.write(terminalId, data);
  });
  ipcMain.on(IPC_CHANNELS.sessionsResize, (_event, payload: unknown) => {
    const { terminalId, cols, rows } = terminalResizeRequestSchema.parse(payload);
    terminalHost.resize(terminalId, cols, rows);
  });
  ipcMain.on(IPC_CHANNELS.sessionsClose, (_event, payload: unknown) => {
    terminalHost.kill(terminalRefSchema.parse(payload).terminalId);
  });

  terminalHost.onOutput((terminalId, data) => {
    const event: TerminalOutputEvent = { terminalId, data };
    sendToRenderer(renderer, IPC_CHANNELS.sessionsOutput, event);
  });
  terminalHost.onExit((terminalId, exitCode) => {
    const event: TerminalExitEvent = { terminalId, exitCode };
    sendToRenderer(renderer, IPC_CHANNELS.sessionsExit, event);
  });
  claudeHookInbox.onEvent((event) => sendToRenderer(renderer, IPC_CHANNELS.sessionsClaudeHook, event));
  claudeSessionStatusFiles.onStatus((status) => sendToRenderer(renderer, IPC_CHANNELS.sessionsStatus, status));
}
