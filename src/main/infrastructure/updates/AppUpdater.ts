import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { AppUpdateStatus } from '@shared/updates/updateTypes';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

interface AppUpdaterDeps {
  logger: FileLogger;
}

export class AppUpdater {
  private readyVersion: string | undefined;
  private listeners = new Set<(status: AppUpdateStatus) => void>();

  constructor(private deps: AppUpdaterDeps) {}

  start(): void {
    const { logger } = this.deps;
    autoUpdater.on('update-downloaded', ({ version }) => {
      logger.info('update.downloaded', { version });
      this.readyVersion = version;
      const status = this.read();
      this.listeners.forEach((listener) => listener(status));
    });
    autoUpdater.on('error', (error) => logger.error('update.failed', { error }));
    // PITFALL: a failed check also arrives as the error event above, so the rejection is only silenced here.
    autoUpdater.checkForUpdates().catch(() => undefined);
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
}
