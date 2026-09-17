import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assertLaunchable, resolveOnPath } from './launchChecks';

describe('launchChecks', () => {
  let emptyDir: string;
  let toolDir: string;
  let pathBefore: string | undefined;

  beforeEach(() => {
    const root = mkdtempSync(join(tmpdir(), 'armada-launch-'));
    emptyDir = join(root, 'empty');
    toolDir = join(root, 'tools');
    mkdirSync(emptyDir);
    mkdirSync(toolDir);
    writeFileSync(join(toolDir, 'armada-tool.exe'), '');
    mkdirSync(join(emptyDir, 'armada-folder.exe'));
    pathBefore = process.env['PATH'];
    process.env['PATH'] = [emptyDir, join(root, 'missing'), toolDir].join(delimiter);
  });

  afterEach(() => {
    process.env['PATH'] = pathBefore;
    rmSync(join(emptyDir, '..'), { recursive: true, force: true });
  });

  it('finds a zero-byte command in a later PATH entry', () => {
    expect(resolveOnPath('armada-tool.exe')).toBe(join(toolDir, 'armada-tool.exe'));
  });

  it('does not mistake a folder for a command', () => {
    expect(resolveOnPath('armada-folder.exe')).toBeUndefined();
  });

  it('names the command and the folder it could not launch', () => {
    expect(() => assertLaunchable('armada-absent.exe', toolDir)).toThrow('armada-absent.exe was not found on PATH');
    expect(() => assertLaunchable('armada-tool.exe', join(toolDir, 'gone'))).toThrow('Folder no longer exists');
  });
});
