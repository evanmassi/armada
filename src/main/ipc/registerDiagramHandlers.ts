import { parse } from 'node:path';
import { dialog, ipcMain, type BrowserWindow } from 'electron';
import {
  diagramRefSchema,
  saveDiagramRequestSchema,
  tileDiagramsRequestSchema,
  type DiagramFormat,
} from '@shared/diagrams/diagramSchemas';
import { IPC_CHANNELS } from '@shared/ipcChannels';
import { diagramFormatOf } from '@main/infrastructure/diagrams/TileDiagramFiles';
import type { ServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { sendToRenderer } from './sendToRenderer';

const SVG_FILE = { name: 'SVG image', extension: 'svg' };
const SAVED_AS: Record<DiagramFormat, { name: string; extension: string }> = { mermaid: SVG_FILE, svg: SVG_FILE, html: { name: 'Web page', extension: 'html' } };

export function registerDiagramHandlers({ tileDiagramFiles }: ServiceContainer, mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.diagramsList, (_event, payload: unknown) =>
    tileDiagramFiles.list(tileDiagramsRequestSchema.parse(payload).tileId),
  );
  ipcMain.handle(IPC_CHANNELS.diagramsRead, (_event, payload: unknown) => tileDiagramFiles.read(diagramRefSchema.parse(payload)));
  ipcMain.handle(IPC_CHANNELS.diagramsSave, async (_event, payload: unknown) => {
    const { fileName, content } = saveDiagramRequestSchema.parse(payload);
    const saved = SAVED_AS[diagramFormatOf(fileName)];
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save diagram',
      defaultPath: `${parse(fileName).name}.${saved.extension}`,
      filters: [{ name: saved.name, extensions: [saved.extension] }],
    });
    if (canceled || !filePath) return undefined;
    await tileDiagramFiles.saveCopy(filePath, content);
    return filePath;
  });

  tileDiagramFiles.onChanged((event) => sendToRenderer(mainWindow.webContents, IPC_CHANNELS.diagramsChanged, event));
}
