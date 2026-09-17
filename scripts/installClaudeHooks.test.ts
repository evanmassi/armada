import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const INSTALLER = join(__dirname, 'installClaudeHooks.cjs');
const ORIGINAL_STATUS_LINE = 'bash /c/Users/someone/.claude/statusline.sh --flag "quoted value"';

describe('installClaudeHooks', () => {
  let home: string;
  let settingsPath: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'armada-home-'));
    settingsPath = join(home, '.claude', 'settings.json');
    mkdirSync(join(home, '.claude'));
  });

  afterEach(() => rmSync(home, { recursive: true, force: true }));

  const install = (): void => {
    execFileSync(process.execPath, [INSTALLER], { env: { ...process.env, USERPROFILE: home, HOME: home } });
  };
  const installedStatusLine = (): string => JSON.parse(readFileSync(settingsPath, 'utf8')).statusLine.command;
  const wrappedCommand = (): string => Buffer.from(installedStatusLine().split(' ').pop() ?? '', 'base64').toString('utf8');

  it('wraps an existing status line once, however often it runs', () => {
    writeFileSync(settingsPath, JSON.stringify({ statusLine: { type: 'command', command: ORIGINAL_STATUS_LINE, padding: 0 } }), 'utf8');
    install();
    const firstInstall = readFileSync(settingsPath, 'utf8');
    install();
    expect(readFileSync(settingsPath, 'utf8')).toBe(firstInstall);
    expect(installedStatusLine()).toContain('claudeStatusLineRelay.cjs');
    expect(wrappedCommand()).toBe(ORIGINAL_STATUS_LINE);
    expect(JSON.parse(firstInstall).statusLine.padding).toBe(0);
  });

  it('installs the bare relay when there is no status line', () => {
    install();
    expect(installedStatusLine().endsWith('claudeStatusLineRelay.cjs"')).toBe(true);
  });
});
