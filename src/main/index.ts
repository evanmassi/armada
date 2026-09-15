import { join } from 'node:path';
import { app, BrowserWindow } from 'electron';
import { createServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { registerBoardHandlers } from '@main/ipc/registerBoardHandlers';
import { registerConversationHandlers } from '@main/ipc/registerConversationHandlers';
import { registerProjectHandlers } from '@main/ipc/registerProjectHandlers';
import { registerSessionHandlers } from '@main/ipc/registerSessionHandlers';

const WINDOW_BACKGROUND = '#0d0f12';

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    backgroundColor: WINDOW_BACKGROUND,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererDevServerUrl) {
    void mainWindow.loadURL(rendererDevServerUrl);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return mainWindow;
}

app.whenReady().then(() => {
  const container = createServiceContainer();
  const mainWindow = createMainWindow();

  registerConversationHandlers(container);
  registerProjectHandlers(mainWindow);
  registerBoardHandlers(container);
  registerSessionHandlers(container, mainWindow.webContents);

  const killAllTerminalsOnRendererReload = (): void => container.terminalHost.killAll();
  mainWindow.webContents.on('did-start-navigation', killAllTerminalsOnRendererReload);
  app.on('before-quit', () => container.terminalHost.killAll());
});

app.on('window-all-closed', () => app.quit());
