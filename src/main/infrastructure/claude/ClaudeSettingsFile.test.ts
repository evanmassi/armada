import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { ClaudeSettingsFile } from './ClaudeSettingsFile';

describe('ClaudeSettingsFile', () => {
  let home: string;
  let settingsPath: string;
  let settingsFile: ClaudeSettingsFile;

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), 'armada-settings-'));
    settingsPath = join(home, '.claude', 'settings.json');
    settingsFile = new ClaudeSettingsFile({ settingsPath, scriptsDir: join(home, 'scripts'), logger: new FileLogger(join(home, 'armada.log')) });
  });

  afterEach(() => rm(home, { recursive: true, force: true }));

  it('reports every gap when Claude Code has no settings file, and repairs by creating it', async () => {
    expect(await settingsFile.checkIntegration()).toEqual({ gaps: ['hooks', 'statusLine'] });
    expect(await settingsFile.repairIntegration()).toEqual({ gaps: [] });
    expect(await settingsFile.checkIntegration()).toEqual({ gaps: [] });
  });

  it('does not rewrite a file that is already integrated', async () => {
    await settingsFile.repairIntegration();
    const compact = JSON.stringify(JSON.parse(await readFile(settingsPath, 'utf8')));
    await writeFile(settingsPath, compact, 'utf8');
    await settingsFile.repairIntegration();
    expect(await readFile(settingsPath, 'utf8')).toBe(compact);
  });

  it('refuses to touch settings it cannot parse', async () => {
    await settingsFile.repairIntegration();
    await writeFile(settingsPath, '{ "hooks": ', 'utf8');
    await expect(settingsFile.repairIntegration()).rejects.toThrow('left them alone');
    expect(await readFile(settingsPath, 'utf8')).toBe('{ "hooks": ');
  });
});
