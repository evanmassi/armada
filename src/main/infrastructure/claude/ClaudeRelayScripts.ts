import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isMissingPath } from '@main/infrastructure/fileErrors';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { RELAY_SCRIPTS } from './claudeSettingsIntegration';

const readIfPresent = async (filePath: string): Promise<string | undefined> => {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (isMissingPath(error)) return undefined;
    throw error;
  }
};

interface ClaudeRelayScriptsDeps {
  sourceDir: string;
  installDir: string;
  logger: FileLogger;
}

export class ClaudeRelayScripts {
  constructor(private deps: ClaudeRelayScriptsDeps) {}

  async install(): Promise<void> {
    const { sourceDir, installDir, logger } = this.deps;
    try {
      await mkdir(installDir, { recursive: true });
      for (const script of RELAY_SCRIPTS) {
        const source = await readFile(join(sourceDir, script), 'utf8');
        const installedPath = join(installDir, script);
        if ((await readIfPresent(installedPath)) === source) continue;
        const draftPath = `${installedPath}.${process.pid}.tmp`;
        await writeFile(draftPath, source, 'utf8');
        await rename(draftPath, installedPath);
        logger.info('relay.installed', { installedPath });
      }
    } catch (error) {
      logger.error('relay.installFailed', { installDir, error });
    }
  }
}
