const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { homedir } = require('node:os');
const { dirname, join } = require('node:path');

const settingsPath = join(homedir(), '.claude', 'settings.json');
const scriptCommand = (name) => `node "${join(__dirname, name).split('\\').join('/')}"`;
const command = scriptCommand('claudeHookRelay.cjs');
const ARMADA_COMMANDS = new Set([command, scriptCommand('claudeSessionStartHook.cjs')]);
const MATCHER_BY_EVENT = {
  SessionStart: undefined,
  UserPromptSubmit: undefined,
  Stop: undefined,
  Notification: 'permission_prompt',
};

const STATUS_LINE_RELAY = 'claudeStatusLineRelay.cjs';

const isArmadaGroup = (group) => (group.hooks ?? []).every((hook) => ARMADA_COMMANDS.has(hook.command));

const relayedStatusLine = (statusLine) => {
  const current = statusLine?.command;
  const isRelayed = current?.includes(STATUS_LINE_RELAY);
  const encodedOriginal = isRelayed
    ? current.slice(current.indexOf(STATUS_LINE_RELAY) + STATUS_LINE_RELAY.length + 1).trim()
    : current && Buffer.from(current, 'utf8').toString('base64');
  return { ...statusLine, type: 'command', command: [scriptCommand(STATUS_LINE_RELAY), encodedOriginal].filter(Boolean).join(' ') };
};

const before = existsSync(settingsPath) ? readFileSync(settingsPath, 'utf8') : '{}';
const settings = JSON.parse(before);
const hooks = (settings.hooks ??= {});
for (const [event, matcher] of Object.entries(MATCHER_BY_EVENT)) {
  const group = { ...(matcher && { matcher }), hooks: [{ type: 'command', command }] };
  hooks[event] = [...(hooks[event] ?? []).filter((existing) => !isArmadaGroup(existing)), group];
}
settings.statusLine = relayedStatusLine(settings.statusLine);

const after =`${JSON.stringify(settings, null, 2)}\n`;
if (after === before) {
  console.log(`Armada hooks already present in ${settingsPath}`);
} else {
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, after, 'utf8');
  console.log(`Armada hooks written to ${settingsPath} for ${Object.keys(MATCHER_BY_EVENT).join(', ')}, and the status line relayed for usage`);
}
