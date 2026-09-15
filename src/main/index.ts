import { join } from 'node:path';
import { app, BrowserWindow } from 'electron';
import { createServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { registerConversationHandlers } from '@main/ipc/registerConversationHandlers';
import { registerProjectHandlers } from '@main/ipc/registerProjectHandlers';
import { registerSessionHandlers } from '@main/ipc/registerSessionHandlers';
import { registerWorkspaceHandlers } from '@main/ipc/registerWorkspaceHandlers';
import appIdentity from '../../build/appIdentity.json';

const WINDOW_BACKGROUND = '#07090d';
const APP_ICON_PATH = join(__dirname, '../../build/armada.ico');

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    backgroundColor: WINDOW_BACKGROUND,
    icon: APP_ICON_PATH,
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

app.setAppUserModelId(appIdentity.appUserModelId);

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(() => {
  const container = createServiceContainer();
  const mainWindow = createMainWindow();

  app.on('second-instance', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  registerConversationHandlers(container);
  registerProjectHandlers(mainWindow);
  registerWorkspaceHandlers(container);
  registerSessionHandlers(container, mainWindow.webContents);

  const killAllTerminals = (): void => container.terminalHost.killAll();
  mainWindow.webContents.on('did-start-navigation', killAllTerminals);
  mainWindow.on('close', killAllTerminals);
});

app.on('window-all-closed', () => app.quit());
