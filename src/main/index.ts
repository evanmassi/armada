import { join } from 'node:path';
import { app, BrowserWindow, Menu } from 'electron';
import { createServiceContainer } from '@main/infrastructure/di/ServiceContainer';
import { separateDevDataFolder } from '@main/infrastructure/paths';
import { registerConversationHandlers } from '@main/ipc/registerConversationHandlers';
import { registerFileHandlers } from '@main/ipc/registerFileHandlers';
import { registerIntegrationHandlers } from '@main/ipc/registerIntegrationHandlers';
import { registerLinkHandlers } from '@main/ipc/registerLinkHandlers';
import { registerProjectHandlers } from '@main/ipc/registerProjectHandlers';
import { registerSessionHandlers } from '@main/ipc/registerSessionHandlers';
import { registerUsageHandlers } from '@main/ipc/registerUsageHandlers';
import { registerWorkspaceHandlers } from '@main/ipc/registerWorkspaceHandlers';
import appIdentity from '../../build/appIdentity.json';

const WINDOW_BACKGROUND = '#07090d';
const APP_ICON_PATH = join(__dirname, '../../build/armada.ico');
const APP_TITLE = app.isPackaged ? appIdentity.displayName : `${appIdentity.displayName} Dev`;
const APP_USER_MODEL_ID = app.isPackaged ? appIdentity.appUserModelId : `${appIdentity.appUserModelId}.dev`;

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    title: APP_TITLE,
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
  mainWindow.on('page-title-updated', (event) => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  // PITFALL: a file dropped outside a terminal navigates the window to it, which restarts every session.
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererDevServerUrl) {
    void mainWindow.loadURL(rendererDevServerUrl);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return mainWindow;
}

separateDevDataFolder();
app.setAppUserModelId(APP_USER_MODEL_ID);
Menu.setApplicationMenu(null);

const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.quit();

app.whenReady().then(() => {
  if (!isPrimaryInstance) return;
  const container = createServiceContainer();
  container.logger.info('app.started', { version: app.getVersion(), electron: process.versions.electron });
  process.on('uncaughtException', (error) => container.logger.error('main.uncaughtException', { error }));
  process.on('unhandledRejection', (reason) => container.logger.error('main.unhandledRejection', { error: reason }));
  void container.claudeRelayScripts.install();
  const mainWindow = createMainWindow();

  app.on('second-instance', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  registerConversationHandlers(container);
  registerIntegrationHandlers(container);
  registerProjectHandlers(container, mainWindow);
  registerLinkHandlers(container);
  registerFileHandlers(container);
  registerWorkspaceHandlers(container);
  registerSessionHandlers(container, mainWindow.webContents);
  registerUsageHandlers(container, mainWindow.webContents);
  void container.claudeHookInbox.start();
  void container.claudeSessionStatusFiles.start();
  void container.claudeUsageFile.start();
  container.claudeUsageProbe.start();
  if (app.isPackaged) container.appUpdater.start();

  const killAllTerminals = (): void => container.terminalHost.killAll();
  mainWindow.webContents.on('did-start-navigation', killAllTerminals);
  mainWindow.on('close', () => {
    container.logger.info('app.closing');
    killAllTerminals();
    container.claudeHookInbox.stop();
    container.claudeSessionStatusFiles.stop();
    container.claudeUsageFile.stop();
    container.claudeUsageProbe.stop();
  });
});

app.on('window-all-closed', () => app.quit());
