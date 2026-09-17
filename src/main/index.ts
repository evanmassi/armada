import { join } from 'node:path';
import { app, BrowserWindow, Menu } from 'electron';
import { createServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { registerConversationHandlers } from '@main/ipc/registerConversationHandlers';
import { registerIntegrationHandlers } from '@main/ipc/registerIntegrationHandlers';
import { registerLinkHandlers } from '@main/ipc/registerLinkHandlers';
import { registerProjectHandlers } from '@main/ipc/registerProjectHandlers';
import { registerSessionHandlers } from '@main/ipc/registerSessionHandlers';
import { registerUsageHandlers } from '@main/ipc/registerUsageHandlers';
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
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererDevServerUrl) {
    void mainWindow.loadURL(rendererDevServerUrl);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return mainWindow;
}

app.setAppUserModelId(appIdentity.appUserModelId);
Menu.setApplicationMenu(null);

const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.quit();

app.whenReady().then(() => {
  if (!isPrimaryInstance) return;
  const container = createServiceContainer();
  container.logger.info('app.started', { version: app.getVersion(), electron: process.versions.electron });
  process.on('uncaughtException', (error) => container.logger.error('main.uncaughtException', { error }));
  process.on('unhandledRejection', (reason) => container.logger.error('main.unhandledRejection', { error: reason }));
  const mainWindow = createMainWindow();

  app.on('second-instance', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  registerConversationHandlers(container);
  registerIntegrationHandlers(container);
  registerProjectHandlers(container, mainWindow);
  registerLinkHandlers(container);
  registerWorkspaceHandlers(container);
  registerSessionHandlers(container, mainWindow.webContents);
  registerUsageHandlers(container, mainWindow.webContents);
  void container.claudeHookInbox.start();
  void container.claudeUsageFile.start();

  const killAllTerminals = (): void => container.terminalHost.killAll();
  mainWindow.webContents.on('did-start-navigation', killAllTerminals);
  mainWindow.on('close', () => {
    container.logger.info('app.closing');
    killAllTerminals();
    container.claudeHookInbox.stop();
    container.claudeUsageFile.stop();
  });
});

app.on('window-all-closed', () => app.quit());
