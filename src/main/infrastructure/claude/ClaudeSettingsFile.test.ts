import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
    await mkdir(dirname(settingsPath));
    settingsFile = new ClaudeSettingsFile({ settingsPath, scriptsDir: join(home, 'scripts'), relayRuntime: process.execPath, logger: new FileLogger({ filePath: join(home, 'armada.log') }) });
  });

  afterEach(() => rm(home, { recursive: true, force: true }));

  it('reports every gap when Claude Code has no settings file, and repairs by creating it', async () => {
    expect(await settingsFile.checkIntegration()).toEqual({ gaps: ['hooks', 'statusLine'], isNodeAvailable: true, settingsPath });
    expect(await settingsFile.repairIntegration()).toEqual({ gaps: [], isNodeAvailable: true, settingsPath });
    expect(await settingsFile.checkIntegration()).toEqual({ gaps: [], isNodeAvailable: true, settingsPath });
  });

  it('reports when the runtime the relays need is not installed', async () => {
    const withoutNode = new ClaudeSettingsFile({ settingsPath, scriptsDir: join(home, 'scripts'), relayRuntime: join(home, 'missing-node.exe'), logger: new FileLogger({ filePath: join(home, 'armada.log') }) });
    expect((await withoutNode.checkIntegration()).isNodeAvailable).toBe(false);
  });

  it('does not rewrite a file that is already integrated', async () => {
    await settingsFile.repairIntegration();
    const compact = JSON.stringify(JSON.parse(await readFile(settingsPath, 'utf8')));
    await writeFile(settingsPath, compact, 'utf8');
    await settingsFile.repairIntegration();
    expect(await readFile(settingsPath, 'utf8')).toBe(compact);
  });

  it('changes one setting and keeps every other entry in place', async () => {
    const original = { model: 'opus', idleCompaction: true, permissions: { allow: ['Read'] }, verbose: 'loud' };
    await writeFile(settingsPath, JSON.stringify(original), 'utf8');
    expect(await settingsFile.readSettingValues()).toEqual({ idleCompaction: true, verbose: 'loud' });
    expect(await settingsFile.changeSetting({ key: 'idleCompaction', value: false })).toEqual({ idleCompaction: false, verbose: 'loud' });
    expect(Object.entries(JSON.parse(await readFile(settingsPath, 'utf8')))).toEqual(Object.entries({ ...original, idleCompaction: false }));
  });

  it('removes a setting handed back to the default', async () => {
    await writeFile(settingsPath, JSON.stringify({ model: 'opus', fastMode: true }), 'utf8');
    await settingsFile.changeSetting({ key: 'fastMode', value: undefined });
    expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({ model: 'opus' });
  });

  it('applies changes made at the same moment one after another', async () => {
    await Promise.all([
      settingsFile.changeSetting({ key: 'verbose', value: true }),
      settingsFile.changeSetting({ key: 'fastMode', value: true }),
      settingsFile.repairIntegration(),
    ]);
    const settings = JSON.parse(await readFile(settingsPath, 'utf8'));
    expect(settings).toMatchObject({ verbose: true, fastMode: true });
    expect((await settingsFile.checkIntegration()).gaps).toEqual([]);
  });

  it('refuses to touch settings it cannot parse', async () => {
    await settingsFile.repairIntegration();
    await writeFile(settingsPath, '{ "hooks": ', 'utf8');
    await expect(settingsFile.repairIntegration()).rejects.toThrow('left them alone');
    expect(await readFile(settingsPath, 'utf8')).toBe('{ "hooks": ');
  });
});
