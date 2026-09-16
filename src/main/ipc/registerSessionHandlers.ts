import { ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import {
  type ClaudeHookEvent,
  openSessionRequestSchema,
  terminalRefSchema,
  terminalResizeRequestSchema,
  terminalWriteRequestSchema,
  type TerminalExitEvent,
  type TerminalOutputEvent,
} from '@shared/sessions/sessionSchemas';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';

export function registerSessionHandlers({ sessionService, terminalHost, claudeHookInbox }: ServiceContainer, renderer: WebContents): void {
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
    if (renderer.isDestroyed()) return;
    const event: TerminalOutputEvent = { terminalId, data };
    renderer.send(IPC_CHANNELS.sessionsOutput, event);
  });
  terminalHost.onExit((terminalId, exitCode) => {
    if (renderer.isDestroyed()) return;
    const event: TerminalExitEvent = { terminalId, exitCode };
    renderer.send(IPC_CHANNELS.sessionsExit, event);
  });
  claudeHookInbox.onEvent((event: ClaudeHookEvent) => {
    if (renderer.isDestroyed()) return;
    renderer.send(IPC_CHANNELS.sessionsClaudeHook, event);
  });
}
