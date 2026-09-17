import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ClaudeIntegrationStatus } from '@shared/integration/integrationTypes';
import { isMissingPath } from '@main/infrastructure/fileErrors';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { claudeSettingsSchema, findIntegrationGaps, integrateArmada, type ClaudeSettings } from './claudeSettingsIntegration';

interface ClaudeSettingsFileDeps {
  settingsPath: string;
  scriptsDir: string;
  logger: FileLogger;
}

export class ClaudeSettingsFile {
  constructor(private deps: ClaudeSettingsFileDeps) {}

  async checkIntegration(): Promise<ClaudeIntegrationStatus> {
    return { gaps: findIntegrationGaps(await this.read(), this.deps.scriptsDir) };
  }

  async repairIntegration(): Promise<ClaudeIntegrationStatus> {
    const { settingsPath, scriptsDir, logger } = this.deps;
    const settings = await this.read();
    const gaps = findIntegrationGaps(settings, scriptsDir);
    if (gaps.length === 0) return { gaps };
    const integrated = integrateArmada(settings, scriptsDir);
    await mkdir(dirname(settingsPath), { recursive: true });
    const draftPath = `${settingsPath}.armada.tmp`;
    await writeFile(draftPath, `${JSON.stringify(integrated, null, 2)}\n`, 'utf8');
    await rename(draftPath, settingsPath);
    logger.info('integration.repaired', { settingsPath, gaps });
    return { gaps: findIntegrationGaps(integrated, scriptsDir) };
  }

  private async read(): Promise<ClaudeSettings> {
    const { settingsPath, logger } = this.deps;
    let raw: string;
    try {
      raw = await readFile(settingsPath, 'utf8');
    } catch (error) {
      if (isMissingPath(error)) return {};
      throw error;
    }
    try {
      return claudeSettingsSchema.parse(JSON.parse(raw));
    } catch (error) {
      logger.error('integration.settingsUnreadable', { settingsPath, error });
      throw new Error(`Claude Code settings could not be read, so Armada left them alone: ${settingsPath}`);
    }
  }
}
