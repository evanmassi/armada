import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ArmadaApi, Unsubscribe } from '@shared/armadaApi';
import { IPC_CHANNELS } from '@shared/ipcChannels';

function subscribe<TEvent>(channel: string, listener: (event: TEvent) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, payload: TEvent): void => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

const armadaApi: ArmadaApi = {
  conversations: {
    listProjects: () => ipcRenderer.invoke(IPC_CHANNELS.conversationsListProjects),
  },
  projects: {
    pickFolder: () => ipcRenderer.invoke(IPC_CHANNELS.projectsPickFolder),
  },
  workspace: {
    load: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceLoad),
    save: (workspace) => ipcRenderer.invoke(IPC_CHANNELS.workspaceSave, workspace),
  },
  sessions: {
    open: (request) => ipcRenderer.invoke(IPC_CHANNELS.sessionsOpen, request),
    write: (request) => ipcRenderer.send(IPC_CHANNELS.sessionsWrite, request),
    resize: (request) => ipcRenderer.send(IPC_CHANNELS.sessionsResize, request),
    close: (request) => ipcRenderer.send(IPC_CHANNELS.sessionsClose, request),
    onOutput: (listener) => subscribe(IPC_CHANNELS.sessionsOutput, listener),
    onExit: (listener) => subscribe(IPC_CHANNELS.sessionsExit, listener),
    onClaudeSessionStarted: (listener) => subscribe(IPC_CHANNELS.sessionsClaudeStarted, listener),
  },
};

contextBridge.exposeInMainWorld('armada', armadaApi);
