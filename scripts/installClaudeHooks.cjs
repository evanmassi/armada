const { readFileSync, writeFileSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

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

const isArmadaGroup = (group) => (group.hooks ?? []).every((hook) => ARMADA_COMMANDS.has(hook.command));

const before = readFileSync(settingsPath, 'utf8');
const settings = JSON.parse(before);
const hooks = (settings.hooks ??= {});
for (const [event, matcher] of Object.entries(MATCHER_BY_EVENT)) {
  const group = { ...(matcher && { matcher }), hooks: [{ type: 'command', command }] };
  hooks[event] = [...(hooks[event] ?? []).filter((existing) => !isArmadaGroup(existing)), group];
}

const after = `${JSON.stringify(settings, null, 2)}\n`;
if (after === before) {
  console.log(`Armada hooks already present in ${settingsPath}`);
} else {
  writeFileSync(settingsPath, after, 'utf8');
  console.log(`Armada hooks written to ${settingsPath} for ${Object.keys(MATCHER_BY_EVENT).join(', ')}`);
}
