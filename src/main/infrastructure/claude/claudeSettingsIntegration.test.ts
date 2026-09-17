import { describe, expect, it } from 'vitest';
import { findIntegrationGaps, integrateArmada, type ClaudeSettings } from './claudeSettingsIntegration';

const SCRIPTS_DIR = 'C:\\dev\\armada\\scripts';
const HOOK_COMMAND = 'node "C:/dev/armada/scripts/claudeHookRelay.cjs"';
const STATUS_LINE_RELAY = 'node "C:/dev/armada/scripts/claudeStatusLineRelay.cjs"';
const ORIGINAL_STATUS_LINE = 'bash /c/Users/someone/.claude/statusline.sh --flag "quoted value"';
const ENCODED_STATUS_LINE = Buffer.from(ORIGINAL_STATUS_LINE, 'utf8').toString('base64');

const userGroup = (command: string) => ({ hooks: [{ type: 'command', command }] });

describe('integrateArmada', () => {
  it('installs every hook and the bare relay into empty settings', () => {
    const integrated = integrateArmada({}, SCRIPTS_DIR);
    expect(Object.keys(integrated.hooks ?? {})).toEqual(['SessionStart', 'UserPromptSubmit', 'Stop', 'Notification']);
    expect(integrated.hooks?.['Notification']).toEqual([{ matcher: 'permission_prompt', hooks: [{ type: 'command', command: HOOK_COMMAND }] }]);
    expect(integrated.statusLine).toEqual({ type: 'command', command: STATUS_LINE_RELAY });
  });

  it('wraps an existing status line once and keeps its other fields', () => {
    const settings: ClaudeSettings = { statusLine: { type: 'command', command: ORIGINAL_STATUS_LINE, padding: 0 } };
    const once = integrateArmada(settings, SCRIPTS_DIR);
    expect(once.statusLine).toEqual({ type: 'command', command: `${STATUS_LINE_RELAY} ${ENCODED_STATUS_LINE}`, padding: 0 });
    expect(integrateArmada(once, SCRIPTS_DIR)).toEqual(once);
  });

  it('leaves the rest of the settings file and the user’s own hooks untouched, in place', () => {
    const settings: ClaudeSettings = {
      effortLevel: 'xhigh',
      hooks: {
        Stop: [userGroup('echo first'), userGroup(HOOK_COMMAND), userGroup('echo last')],
        PreToolUse: [userGroup('echo guard')],
      },
    };
    const integrated = integrateArmada(settings, SCRIPTS_DIR);
    expect(integrated['effortLevel']).toBe('xhigh');
    expect(integrated.hooks?.['PreToolUse']).toEqual(settings.hooks?.['PreToolUse']);
    expect(integrated.hooks?.['Stop']).toEqual(settings.hooks?.['Stop']);
  });

  it('repoints relays left behind by a moved repo folder instead of stacking new ones', () => {
    const moved = integrateArmada({ statusLine: { type: 'command', command: ORIGINAL_STATUS_LINE } }, 'D:\\old\\armada\\scripts');
    const integrated = integrateArmada(moved, SCRIPTS_DIR);
    expect(integrated.hooks?.['Stop']).toEqual([userGroup(HOOK_COMMAND)]);
    expect(integrated.statusLine?.command).toBe(`${STATUS_LINE_RELAY} ${ENCODED_STATUS_LINE}`);
  });
});

describe('findIntegrationGaps', () => {
  it('reports nothing once integrated', () => {
    expect(findIntegrationGaps(integrateArmada({}, SCRIPTS_DIR), SCRIPTS_DIR)).toEqual([]);
  });

  it('names each missing piece', () => {
    const integrated = integrateArmada({}, SCRIPTS_DIR);
    expect(findIntegrationGaps({}, SCRIPTS_DIR)).toEqual(['hooks', 'statusLine']);
    expect(findIntegrationGaps({ ...integrated, statusLine: { type: 'command', command: ORIGINAL_STATUS_LINE } }, SCRIPTS_DIR)).toEqual(['statusLine']);
    expect(findIntegrationGaps({ ...integrated, hooks: { ...integrated.hooks, Stop: [] } }, SCRIPTS_DIR)).toEqual(['hooks']);
  });
});
