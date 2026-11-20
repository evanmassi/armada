import { readFile } from 'node:fs/promises';
import type { DiagramFolderTrust } from '@shared/integration/integrationTypes';
import { isMissingPath } from '@main/infrastructure/fileErrors';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { parseJsonOrUndefined } from '@main/infrastructure/safeJson';
import { claudeGlobalConfigSchema, isFolderTrusted, type ClaudeGlobalConfig } from './claudeTrustRecords';

interface ClaudeFolderTrustDeps {
  configPath: string;
  folder: string;
  logger: FileLogger;
}

const TRUSTING_NOTHING: ClaudeGlobalConfig = { projects: {} };

export class ClaudeFolderTrust {
  constructor(private deps: ClaudeFolderTrustDeps) {}

  async check(): Promise<DiagramFolderTrust> {
    const { folder } = this.deps;
    return { folder, isTrusted: isFolderTrusted(await this.readConfig(), folder) };
  }

  private async readConfig(): Promise<ClaudeGlobalConfig> {
    const { configPath, logger } = this.deps;
    let raw: string;
    try {
      raw = await readFile(configPath, 'utf8');
    } catch (error) {
      if (!isMissingPath(error)) logger.error('folderTrust.configUnreadable', { configPath, error });
      return TRUSTING_NOTHING;
    }
    const parsed = claudeGlobalConfigSchema.safeParse(parseJsonOrUndefined(raw));
    if (!parsed.success) {
      logger.error('folderTrust.configUnparsable', { configPath });
      return TRUSTING_NOTHING;
    }
    return parsed.data;
  }
}
