import { autoUpdater } from 'electron-updater';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

interface AppUpdaterDeps {
  logger: FileLogger;
}

export class AppUpdater {
  constructor(private deps: AppUpdaterDeps) {}

  start(): void {
    const { logger } = this.deps;
    autoUpdater.on('update-downloaded', ({ version }) => logger.info('update.downloaded', { version }));
    autoUpdater.on('error', (error) => logger.error('update.failed', { error }));
    // PITFALL: a failed check also arrives as the error event above, so the rejection is only silenced here.
    autoUpdater.checkForUpdates().catch(() => undefined);
  }
}
