import { app, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { AppUpdateInstallMethod, AppUpdateStatus } from '@shared/updates/updateTypes';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const RELEASE_PAGE_URL = 'https://github.com/evanmassi/armada/releases/tag/v';
// PITFALL: Squirrel.Mac installs only signed apps, so the unsigned Mac build finds an update and sends the user to download it.
const INSTALL_METHOD: AppUpdateInstallMethod = process.platform === 'darwin' ? 'download' : 'restart';
const OFFLINE_ERROR_CODES = ['net::ERR_NETWORK_IO_SUSPENDED', 'net::ERR_TIMED_OUT', 'net::ERR_INTERNET_DISCONNECTED'];

interface AppUpdaterDeps {
  logger: FileLogger;
}

export class AppUpdater {
  private readyVersion: string | undefined;
  private isRestartingToInstall = false;
  private listeners = new Set<(status: AppUpdateStatus) => void>();

  constructor(private deps: AppUpdaterDeps) {}

  start(): void {
    const { logger } = this.deps;
    autoUpdater.autoDownload = INSTALL_METHOD === 'restart';
    autoUpdater.on('update-available', ({ version }) => {
      if (INSTALL_METHOD === 'download') {
        logger.info('update.available', { version });
        this.setReadyVersion(version);
        return;
      }
      if (!this.readyVersion || this.readyVersion === version) return;
      // PITFALL: electron-updater deletes the waiting installer as soon as it starts downloading a different version.
      logger.info('update.superseded', { version: this.readyVersion, by: version });
      this.setReadyVersion(undefined);
    });
    autoUpdater.on('update-downloaded', ({ version }) => {
      logger.info('update.downloaded', { version });
      this.setReadyVersion(version);
    });
    autoUpdater.on('error', (error) => {
      const isOffline = OFFLINE_ERROR_CODES.some((code) => error.message.includes(code));
      if (isOffline) logger.info('update.offline', { error });
      else logger.error('update.failed', { error });
    });
    app.on('will-quit', () => {
      if (INSTALL_METHOD === 'restart' && this.readyVersion && !this.isRestartingToInstall) logger.info('update.installingOnQuit', { version: this.readyVersion });
    });
    const checkForUpdates = (): void => {
      // PITFALL: a failed check or download also arrives as the error event above, so both rejections are only silenced here.
      autoUpdater
        .checkForUpdates()
        .then((result) => result?.downloadPromise?.catch(() => undefined))
        .catch(() => undefined);
    };
    checkForUpdates();
    setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
  }

  read(): AppUpdateStatus {
    return { currentVersion: app.getVersion(), installMethod: INSTALL_METHOD, ...(this.readyVersion && { readyVersion: this.readyVersion }) };
  }

  onChange(listener: (status: AppUpdateStatus) => void): void {
    this.listeners.add(listener);
  }

  async install(): Promise<void> {
    if (!this.readyVersion) throw new Error('No update is waiting to install');
    if (INSTALL_METHOD === 'download') {
      await shell.openExternal(`${RELEASE_PAGE_URL}${this.readyVersion}`);
      return;
    }
    this.deps.logger.info('update.installing', { version: this.readyVersion });
    this.isRestartingToInstall = true;
    autoUpdater.quitAndInstall(true, true);
  }

  private setReadyVersion(version: string | undefined): void {
    this.readyVersion = version;
    const status = this.read();
    this.listeners.forEach((listener) => listener(status));
  }
}
