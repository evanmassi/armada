import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  CLAUDE_SETTINGS,
  type ChangeClaudeSettingRequest,
  type ClaudeSettingValue,
  type ClaudeSettingValues,
} from '@shared/claudeSettings/claudeSettingSchemas';
import type { ClaudeIntegrationGap, ClaudeIntegrationStatus } from '@shared/integration/integrationTypes';
import { isMissingPath } from '@main/infrastructure/fileErrors';
import { resolveOnPath } from '@main/infrastructure/launchChecks';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { claudeSettingsSchema, findIntegrationGaps, integrateArmada, type ClaudeSettings } from './claudeSettingsIntegration';

interface ClaudeSettingsFileDeps {
  settingsPath: string;
  scriptsDir: string;
  relayRuntime: string;
  logger: FileLogger;
}

const isSettingValue = (value: unknown): value is ClaudeSettingValue => ['boolean', 'string', 'number'].includes(typeof value);

const settingValuesOf = (settings: ClaudeSettings): ClaudeSettingValues =>
  Object.fromEntries(CLAUDE_SETTINGS.map(({ key }) => [key, settings[key]]).filter(([, value]) => isSettingValue(value)));

export class ClaudeSettingsFile {
  private pendingEdit: Promise<unknown> = Promise.resolve();

  constructor(private deps: ClaudeSettingsFileDeps) {}

  async checkIntegration(): Promise<ClaudeIntegrationStatus> {
    return this.status(findIntegrationGaps(await this.read(), this.deps.scriptsDir));
  }

  repairIntegration(): Promise<ClaudeIntegrationStatus> {
    return this.oneEditAtATime(async () => {
      const { settingsPath, scriptsDir, logger } = this.deps;
      const settings = await this.read();
      const gaps = findIntegrationGaps(settings, scriptsDir);
      if (gaps.length === 0) return this.status(gaps);
      const integrated = integrateArmada(settings, scriptsDir);
      await this.write(integrated);
      logger.info('integration.repaired', { settingsPath, gaps });
      return this.status(findIntegrationGaps(integrated, scriptsDir));
    });
  }

  async readSettingValues(): Promise<ClaudeSettingValues> {
    return settingValuesOf(await this.read());
  }

  changeSetting({ key, value }: ChangeClaudeSettingRequest): Promise<ClaudeSettingValues> {
    return this.oneEditAtATime(async () => {
      const changed: ClaudeSettings = { ...(await this.read()), [key]: value };
      if (value === undefined) delete changed[key];
      await this.write(changed);
      this.deps.logger.info('settings.changed', { key, value });
      return settingValuesOf(changed);
    });
  }

  private oneEditAtATime<T>(edit: () => Promise<T>): Promise<T> {
    const result = this.pendingEdit.then(edit);
    this.pendingEdit = result.catch(() => undefined);
    return result;
  }

  private async write(settings: ClaudeSettings): Promise<void> {
    const { settingsPath } = this.deps;
    await mkdir(dirname(settingsPath), { recursive: true });
    const draftPath = `${settingsPath}.armada.tmp`;
    await writeFile(draftPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
    await rename(draftPath, settingsPath);
  }

  private status(gaps: ClaudeIntegrationGap[]): ClaudeIntegrationStatus {
    return { gaps, isNodeAvailable: resolveOnPath(this.deps.relayRuntime) !== undefined, settingsPath: this.deps.settingsPath };
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
