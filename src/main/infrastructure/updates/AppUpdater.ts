import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { AppUpdateStatus } from '@shared/updates/updateTypes';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const OFFLINE_ERROR_CODES = ['net::ERR_NETWORK_IO_SUSPENDED', 'net::ERR_TIMED_OUT', 'net::ERR_INTERNET_DISCONNECTED'];

interface AppUpdaterDeps {
  logger: FileLogger;
}

export class AppUpdater {
  private readyVersion: string | undefined;
  private listeners = new Set<(status: AppUpdateStatus) => void>();

  constructor(private deps: AppUpdaterDeps) {}

  start(): void {
    const { logger } = this.deps;
    autoUpdater.on('update-available', ({ version }) => {
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
    return { currentVersion: app.getVersion(), ...(this.readyVersion && { readyVersion: this.readyVersion }) };
  }

  onChange(listener: (status: AppUpdateStatus) => void): void {
    this.listeners.add(listener);
  }

  install(): void {
    if (!this.readyVersion) throw new Error('No downloaded update is waiting to install');
    this.deps.logger.info('update.installing', { version: this.readyVersion });
    autoUpdater.quitAndInstall(true, true);
  }

  private setReadyVersion(version: string | undefined): void {
    this.readyVersion = version;
    const status = this.read();
    this.listeners.forEach((listener) => listener(status));
  }
}
